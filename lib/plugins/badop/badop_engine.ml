(*
    Copyright © 2011, 2012 MLstate

    This file is part of Opa.

    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*)
(** This module provides a functor that casts a Badop interface into a
    record. This is intended as a workaround for the BSL's lack of functors,
    allowing run-time selection of an engine through an added function
    parameter *)

(** TODO - plugins dependencies *)
##property[mli]
##extern-type continuation('a) = 'a QmlCpsServerLib.continuation
##extern-type caml_list('a) = 'a list
##extern-type time_t = int
##property[endmli]

module BslNativeLib = BslUtils
let opa_list_to_ocaml_list = BslUtils.opa_list_to_ocaml_list
let create_outcome x = BslUtils.create_outcome x
(** *****************************)

module D = Badop.Dialog

(* All options *)
type dbgen_options = { force_upgrade: bool; }

type engine_options = (module Badop.S) * Badop.options

##extern-type [normalize] database_options = { dbgen_options: dbgen_options; engine_options: engine_options; }

(* abstracted pseudo polymorphic types (the same inside of each database engine,
   we loose the safety if engines get mixed though) *)
type db

type tr

type rv

type t0 = {
  open_database: unit -> db Cps.t;
  close_database: db -> unit Cps.t;
  status: db -> Badop.status Cps.t;

  tr_start: db -> (exn -> unit) -> tr Cps.t;
  tr_start_at_revision: db -> rv -> (exn -> unit) -> tr Cps.t;
  tr_prepare: tr -> (tr * bool) Cps.t;
  tr_commit: tr -> bool Cps.t;
  tr_abort: tr -> unit Cps.t;

  read: tr -> Badop.path
        -> (D.query,rv) Badop.generic_read_op
        -> (D.response,rv) Badop.generic_read_op Badop.answer Cps.t;

  write: tr -> Badop.path
        -> (D.query,tr,rv) Badop.generic_write_op
        -> (D.response,tr,rv) Badop.generic_write_op Cps.t;

  node_properties: db -> Badop.Structure.Node_property.config -> unit Cps.t;

  options: dbgen_options;
}

##extern-type [normalize] t = t0

module Make_Badop_Record (Backend: Badop.S) :
sig
  val engine: database_options -> t
end = struct

    let engine o = {
      open_database = Obj.magic (fun () -> Backend.open_database (snd o.engine_options));
      close_database = Obj.magic Backend.close_database;
      status = Obj.magic Backend.status;
      tr_start = Obj.magic Backend.Tr.start;
      tr_start_at_revision = Obj.magic Backend.Tr.start_at_revision;
      tr_prepare = Obj.magic Backend.Tr.prepare;
      tr_commit = Obj.magic Backend.Tr.commit;
      tr_abort = Obj.magic Backend.Tr.abort;
      read = Obj.magic Backend.read;
      write = Obj.magic Backend.write;
      node_properties = Obj.magic Backend.node_properties;
      options = o.dbgen_options;
    }

end

(* -- Parsing the command-line options -- *)
module A = ServerArg

(* options parser *)

##register set_default_local: string -> void
let default_local = ref None
let set_default_local (s:string) = default_local := Some s

##register set_default_remote: string -> void
let default_remote = ref None
let set_default_remote (s:string) = default_remote := Some s

let badop_default_local path = {
  Badop.
    path;
  revision = None;
  restore = None;
  dot = false;
  readonly = false;
}

let badop_default_client (host, port) =
  let port = Option.default Badop_meta.default_port port in
  Badop.Options_Client (Scheduler.default, (host, port), fun () -> `abort)

let db_options =
  let arg_parser_dbgen = [
    ["--db-force-upgrade"],
    A.func A.unit
      (fun o () -> { o with dbgen_options = { force_upgrade = true }
           (* { o.dbgen_options with force_upgrade = true } once there is more than 1 field *) }),
      "",
      "Attempt to upgrade an existing database if it differs slightly from the one expected by the application";
  ]
  in
  let dbgen_default = { force_upgrade = false }
  in
  let wrap_parser parse =
    fun o -> A.wrap (parse o.engine_options) (fun bo -> { o with engine_options = bo })
  in
  let make_arg_parser ?name default =
    let engine_options = match !default_local with
      | Some s -> ((module Badop_client : Badop.S), Badop.Options_Local (badop_default_local s))
      | None -> match !default_remote with
        | Some s ->
            begin match (ServerArg.parse_addr_raw s) with
            | None ->
                Logger.error "DbGen/Db3 Bad remote args %s" s;
                exit 1
            | Some x -> ((module Badop_local : Badop.S), badop_default_client x)
            end
        | None -> default.engine_options
    in
    arg_parser_dbgen @
      List.map
      (fun (arg,parse,params,help) -> arg, wrap_parser parse, params, help)
      (Badop_meta.options_parser_with_default ?name engine_options)
  in
  (* association list (backend_opts -> db name) used to check for conflicts *)
  let parsed_engine_options = ref []
  in
  fun ident engine_options ->
    let default = { dbgen_options = dbgen_default; engine_options; }
    in
    (* A first parse, for generic arguments (without the ':database_ident' suffix) *)
    let arg_parse_generic =
      make_arg_parser ?name:ident default
    in
    let parse_generic =
      A.make_parser ~nohelp:(ident <> None) "database options (generic)" arg_parse_generic
    in
    let options =
      try A.filter default parse_generic
      with Exit -> exit 1
    in
    (* A second parse, using the results of the first as default, for options specific to this engine *)
    let db_name = Option.default "database" ident in
    let arg_parse_specific =
      List.map
        (fun (sl,parse,args,help) -> List.map (fun s -> Printf.sprintf "%s:%s" s db_name) sl, parse, args, help)
        (make_arg_parser options)
    in
    let parse_specific =
      A.make_parser ~nohelp:(ident = None)
        (Printf.sprintf "options for database \"%s\"" db_name)
        arg_parse_specific
    in
    let options =
      try A.filter options parse_specific
      with Exit -> exit 1
    in
    (* check for conflicting options with previous settings *)
    try
      let conflicting_db =
        Base.List.assoc_custom_equality ~eq:Badop.Aux.options_conflict
          (snd options.engine_options) !parsed_engine_options
      in
      Logger.critical
        "Error: conflicting configuration for databases \"%s\" and \"%s\": same location%s."
        conflicting_db (Option.default "database" ident)
        (match snd options.engine_options with
         | Badop.Options_Local { Badop.path = str; _ } -> Printf.sprintf " (%s)" str
         | Badop.Options_Client (_,(h,p), _) -> Printf.sprintf " (%s:%d)" (Unix.string_of_inet_addr h) p
         | _ -> "");
      exit 1
    with Not_found ->
        parsed_engine_options :=
          (snd options.engine_options, Option.default "database" ident) :: !parsed_engine_options;
        options

(* Run once after parsers have been applied for all databases *)
##register [opacapi] check_remaining_arguments: -> void
let check_remaining_arguments () = ()

##register [restricted: dbgen; opacapi] local_options: option(string), option(string) -> database_options
let local_options name file_opt =
  let m = (module Badop_local : Badop.S) in
  let o = Badop.Options_Local {
    Badop.
      path = (match file_opt with Some f -> f | None -> Badop_meta.default_file ?name ());
      revision = None;
      restore = None;
      dot = false;
      readonly = false;
  }
  in
  db_options name (m, o)

##register [restricted: dbgen; opacapi] light_options: option(string), option(string) -> database_options
#<Ifstatic:HAS_DBM 1>
let light_options name file_opt =
  let m = (module Badop_light.WithDbm : Badop.S) in
  let o = Badop.Options_Light {
    Badop.
      lpath = (match file_opt with Some f -> f | None -> Badop_meta.default_file ?name ());
      ondemand = None;
      direct = None;
      max_size = None;
  }
  in
  db_options name (m, o)
#<Else>
let light_options _ _ = prerr_endline "This version of OPA was compiled without support for dblight, sorry."; assert false
#<End>

##register [restricted: dbgen; opacapi] client_options: option(string), option(string), option(int) -> database_options
let client_options ident host_opt port_opt =
  let m = (module Badop_client : Badop.S) in
  let default_host = Unix.inet_addr_loopback in
  let host = match host_opt with None -> default_host | Some host ->
    try (Unix.gethostbyname host).Unix.h_addr_list.(0) with Not_found -> default_host in
  let o = badop_default_client (host, port_opt) in
  db_options ident (m, o)

##register [restricted: dbgen; no-projection; opacapi] get: database_options -> t
let get options =
  let { engine_options = (backend, eopts); _ } = options in
  let eopts = match eopts with
    | Badop.Options_Client (sched,server,_on_disconnect) ->
        let on_disconnect () =
          (match ServerLib.field_of_name "server_event_db_error" with
           | Some _record ->
               Logger.error "Database connection error"
               (* TODO - use server plugin *)
               (* let event = *)
               (*   ServerLib.make_record *)
               (*     (ServerLib.add_field ServerLib.empty_record_constructor record ServerLib.void) *)
               (* in *)
               (* BslServer_event.send (Obj.magic event) (QmlCpsServerLib.cont_ml (fun _ -> ())) *)
           | None ->
               Logger.error "Database connection error before OPA runtime initialisation";
               exit 3)
          ;
          #<If:DATABASE_RECONNECT$minlevel 0>
            `retry (Time.seconds (int_of_string (Option.get DebugVariables.database_reconnect)))
          #<Else> `abort #<End>
        in
        Badop.Options_Client (sched,server,on_disconnect)
    | eopts -> eopts
  in
  let module Backend = (val backend : Badop.S) in
  let module Engine = Make_Badop_Record(Backend) in
  Engine.engine { options with engine_options = (backend, eopts) }
