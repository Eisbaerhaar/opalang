/*
    Copyright © 2011 MLstate

    This file is part of Opa.

    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

##extern-type Dom.private.element
##extern-type Canvas.context
##extern-type Canvas.pattern
##extern-type Canvas.gradient
##extern-type Image.data
##extern-type Image.image
##extern-type Canvas.canvas
##extern-type Video.video
##opa-type Canvas.style

// Canvas

##register get: Dom.private.element -> opa[option(Canvas.canvas)]
##args(canvas)
{
    if(canvas && canvas[0] && canvas[0].getContext)
    {
        return js_some(canvas[0])
    }
    return js_none
}

##register to_data_url: Canvas.canvas, string -> opa[option(string)]
##args(canvas, name)
{
    if(canvas.toDataURL && canvas.toDataURL(name))
    {
        return js_some(canvas.toDataURL(name))
    }
    return js_none
}

##register get_width: Canvas.canvas -> int
##args(canvas)
{
    return canvas.width;
}

##register get_height: Canvas.canvas -> int
##args(canvas)
{
    return canvas.height;
}

// Context

##register get_context: Canvas.canvas, string -> opa[option(Canvas.context)]
##args(canvas, name)
{
    if(canvas.getContext && canvas.getContext(name))
    {
        return js_some(canvas.getContext(name))
    }
    return js_none
}

// State
##register save: Canvas.context -> void
##args(context)
{
    context.save()
}

##register restore: Canvas.context -> void
##args(context)
{
    context.restore()
}



  // transformations (default transform is the identity matrix)
##register scale: Canvas.context, float, float -> void
##args(context, x, y)
{
    context.scale(x, y)
}

##register rotate: Canvas.context, float -> void
##args(context, x)
{
    context.rotate(x)
}

##register translate: Canvas.context, int, int -> void
##args(context, x, y)
{
    context.translate(x,y)
}


##register transform: Canvas.context, int, int, int, int, int, int -> void
##args(context, a, b, c, d, e, f)
{
    context.transform(a, b, c, d, e, f)
}

##register set_transform: Canvas.context, int, int, int, int, int, int -> void
##args(context, a, b, c, d, e, f)
{
    context.setTransform(a, b, c, d, e, f)
}

// compositing
##register set_global_alpha: Canvas.context, float -> void
##args(context, a)
{
    context.globalAlpha = a
}

##register get_global_alpha: Canvas.context -> float
##args(context)
{
    return context.globalAlpha
}

// colors and styles

##register set_stroke_style_color: Canvas.context, string -> void
##args(context, c)
{
    context.strokeStyle = c
}

##register set_stroke_style_gradient: Canvas.context, Canvas.gradient -> void
##args(context, c)
{
    context.strokeStyle = c
}

##register set_stroke_style_pattern: Canvas.context, Canvas.pattern -> void
##args(context, c)
{
    context.strokeStyle = c
}

##register set_fill_style_color: Canvas.context, string -> void
##args(context, c)
{
    context.fillStyle = c
}

##register set_fill_style_gradient: Canvas.context, Canvas.gradient -> void
##args(context, c)
{
    context.fillStyle = c
}

##register set_fill_style_pattern: Canvas.context, Canvas.pattern -> void
##args(context, c)
{
    context.fillStyle = c
}

function canvas_get_style_getter(c){
    if(c instanceof CanvasGradient){
        var cmsg = empty_constructor()
        cmsg = add_field(cmsg,static_field_of_name('gradient'),c)
        cmsg = make_record(cmsg)
    }
    else if(c instanceof CanvasPattern){
        var cmsg = empty_constructor()
        cmsg = add_field(cmsg,static_field_of_name('pattern'),c)
        cmsg = make_record(cmsg)
    }
    else if((c instanceof String) || (typeof(c) == "string")){
        var cmsg = empty_constructor()
        cmsg = add_field(cmsg,static_field_of_name('unsafe'),c)
        cmsg = make_record(cmsg)
    }
    else{
        var cmsg = empty_constructor()
        cmsg = add_field(cmsg,static_field_of_name('unsafe'),c)
        cmsg = make_record(cmsg)
    }
    return cmsg
}


##register get_stroke_style: Canvas.context -> opa[Canvas.style]
##args(context)
{
    return canvas_get_style_getter(context.strokeStyle)
}

##register get_fill_style: Canvas.context -> opa[Canvas.style]
##args(context)
{
    return canvas_get_style_getter(context.fillStyle)
}

//Gradient

##register add_color_stop: Canvas.gradient, float, string -> void
##args(gradient,offset,color)
{
    gradient.addColorStop(offset, color)
}

##register create_linear_gradient: Canvas.context, int, int, int, int -> Canvas.gradient
##args(context,x0,y0,x1,y1)
{
    return context.createLinearGradient(x0, y0, x1, y1)
}

##register create_radial_gradient : Canvas.context, int, int, int, int, int, int -> Canvas.gradient
##args(context,x0,y0,r0,x1,y1,r1)
{
    return context.createRadialGradient(x0, y0, r0, x1, y1, r1)
}

//pattern

##register create_pattern_i \ bslcanvas_create_pattern : Canvas.context, Image.image, string -> Canvas.pattern
##register create_pattern_v \ bslcanvas_create_pattern : Canvas.context, Video.video, string -> Canvas.pattern
##register create_pattern_c \ bslcanvas_create_pattern : Canvas.context, Canvas.canvas, string -> Canvas.pattern
function bslcanvas_create_pattern(context, image, repeat)
{
    context.createPattern(image, repeat)
}

// line caps/joins
##register get_line_width: Canvas.context -> float
##args(context)
{
    return context.lineWidth
}

##register set_line_width: Canvas.context, float -> void
##args(context,size)
{

    context.lineWidth = size
}

##register set_line_cap: Canvas.context, string -> void
##args(context, cap)
{
    context.lineCap = cap
}

##register get_line_cap: Canvas.context -> string
##args(context)
{
    return context.lineCap
}

##register set_line_join: Canvas.context, string -> void
##args(context, join)
{
    context.lineJoin = join
}

##register get_line_join: Canvas.context -> string
##args(context)
{
    return context.lineJoin
}

##register set_miter_limit: Canvas.context, float -> void
##args(context, limit)
{
    context.miterLimit = limit
}

##register get_miter_limit: Canvas.context -> float
##args(context)
{
    return context.miterLimit
}
// shadows

##register set_shadow_color: Canvas.context, string -> void
##args(context,color)
{
    context.shadowColor=color
}

##register get_shadow_color: Canvas.context ->  string
##args(context)
{
    return context.shadowColor
}

##register set_shadow_offset_x: Canvas.context, int -> void
##args(context,offset)
{
    context.shadowOffsetX=offset
}

##register get_shadow_offset_x: Canvas.context ->  int
##args(context)
{
    return context.shadowOffsetX
}

##register set_shadow_offset_y: Canvas.context, int -> void
##args(context,offset)
{
    context.shadowOffsetY=offset
}

##register get_shadow_offset_y: Canvas.context ->  int
##args(context)
{
    return context.shadowOffsetY
}

##register set_shadow_blur: Canvas.context, int -> void
##args(context,blur)
{
    context.shadowBlur=blur
}

##register get_shadow_blur: Canvas.context ->  int
##args(context)
{
    return context.shadowBlur
}

// rects
##register clear_rect: Canvas.context, int ,int, int, int -> void
##args(context,x,y,w,h)
{
    context.clearRect(x, y, w, h)
}

##register fill_rect: Canvas.context, int ,int, int, int -> void
##args(context,x,y,w,h)
{
    context.fillRect(x, y, w, h)
}

##register stroke_rect: Canvas.context, int ,int, int, int -> void
##args(context,x,y,w,h)
{
    context.strokeRect(x, y, w, h)
}

// path API
##register begin_path: Canvas.context -> void
##args(context)
{
    context.beginPath()
}


##register close_path: Canvas.context -> void
##args(context)
{
    context.closePath()
}

##register move_to: Canvas.context, int, int -> void
##args(context, x, y)
{
    context.moveTo(x, y)
}

##register line_to: Canvas.context, int, int -> void
##args(context, x, y)
{
    context.lineTo(x, y)
}

##register quadratic_curve_to: Canvas.context, int, int, int, int -> void
##args(context, cpx, cpy, x, y)
{
    context.quadraticCurveTo(cpx, cpy, x, y)
}

##register bezier_curve_to: Canvas.context, int, int, int, int, int, int -> void
##args(context, cp1x, cp1y, cp2x, cp2y, x, y)
{
    context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
}

##register arc_to: Canvas.context, int, int, int, int, int -> void
##args(context, x1, y1, x2, y2, radius)
{
    context.arcTo( x1, y1, x2, y2, radius)
}

##register arc: Canvas.context, int, int, int, float, float, bool -> void
##args(context, centerX, centerY, radius, startingAngle, endingAngle, counterclockwise)
{
    context.arc(centerX, centerY, radius, startingAngle, 
        endingAngle, counterclockwise);
}

##register rect: Canvas.context, int, int, int, int -> void
##args(context, x, y, w, h)
{
    context.rect( x, y, w, h)
}

// ##register arc: Canvas.context, int, int, int, int -> void
// ##args(context, x, y, w, h)
// {
//     context.rect( x, y, w, h)
// }

##register fill: Canvas.context -> void
##args(context)
{
    context.fill()
}

##register stroke: Canvas.context -> void
##args(context)
{
    context.stroke()
}

##register clip: Canvas.context -> void
##args(context)
{
    context.clip()
}

##register is_point_in_path : Canvas.context, int, int -> bool
##args(context, x, y)
{
    return context.isPointInPath(x, y)
}

// focus management
//todo

// text

##register set_font: Canvas.context, string -> void
##args(context, fontText)
{
    context.font = fontText
}

##register set_text_align: Canvas.context, string -> void
##args(context, alignText)
{
    context.textAlign = alignText
}

##register set_text_baseline: Canvas.context, string -> void
##args(context, baselineText)
{
    context.textBaseline = baselineText
}

##register stroke_text: Canvas.context, string, int, int -> void
##args(context, text, x, y)
{
    context.strokeText(text, x, y)
}

##register fill_text: Canvas.context, string, int, int -> void
##args(context, text, x, y)
{
    context.fillText(text, x, y)
}

##register measure_text: Canvas.context, string -> int
##args(context, text)
{
    return context.measureText(text).width
}

// drawing images

##register create_image : string -> Image.image
##args(data)
{
  var img = new Image();
  img.src = data;
  return img
}

##register draw_image_i \ bslcanvas_draw_image: Canvas.context, Image.image, int, int -> void
##register draw_image_c \ bslcanvas_draw_image: Canvas.context, Canvas.canvas, int, int -> void
##register draw_image_v \ bslcanvas_draw_image: Canvas.context, Video.video, int, int -> void
function bslcanvas_draw_image(context, image, x, y)
{
    return context.drawImage(image, x ,y)
}

##register draw_image_di \ bslcanvas_draw_image_d: Canvas.context, Image.image, int, int, int, int -> void
##register draw_image_dc \ bslcanvas_draw_image_d: Canvas.context, Canvas.canvas, int, int, int, int -> void
##register draw_image_dv \ bslcanvas_draw_image_d: Canvas.context, Video.video, int, int, int, int -> void
function bslcanvas_draw_image_d(context, image, x, y, w, h)
{
    return context.drawImage(image, x ,y, w ,h)
}

##register draw_image_fi \ bslcanvas_draw_image_f: Canvas.context, Image.image, int, int, int, int, int, int, int, int -> void
##register draw_image_fc \ bslcanvas_draw_image_f: Canvas.context, Canvas.canvas, int, int, int, int, int, int, int, int -> void
##register draw_image_fv \ bslcanvas_draw_image_f: Canvas.context, Video.video, int, int, int, int, int, int, int, int -> void
function bslcanvas_draw_image_f(context, image, sx, sy, sw, sh, dx, dy, dw, dh)
{
    return context.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
}

// pixel manipulation

##register put_image_data: Canvas.context, Image.data, int, int -> void
##args(context, data, x, y)
{
    context.putImageData(data, x ,y)
}

//other


##register get_image : Dom.private.element -> opa[option(Image.image)]
##args(dom)
{
    if (dom && dom[0] && (dom[0].tagName.toLowerCase() == "img") && dom[0].complete){
        return js_some(dom[0])
    }
    return js_none
}
