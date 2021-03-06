////////////////////////////////////
//    Copyright © 2012 MLstate
//
//    This file is part of Opa.
//
//    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//
//    The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
////////////////////////////////////

var min_node_version = 'v0.6.0',
    max_node_version = 'v0.8.2';

if (process.version < min_node_version) {
    console.error('Your version of node seems to be too old. Please upgrade to a more recent version of node (>= '+min_node_version+')');
    process.exit(1);
} else if (process.version > max_node_version) {
    console.warn('This version of node ('+process.version+') has not been tested with Opa. Use it at your own risks. The last known supported version is '+max_node_version);
}

dependencies = dependencies.filter(function(dependency, index, array) {
    // console.log('Checking', dependency, '...');
    try {
        module.require(dependency);
	return false;
    } catch(e) {
	if (process.version < "v0.8.0") return true;
        return (e.code === 'MODULE_NOT_FOUND');
    }
});

if (dependencies.length > 0) {
    console.error(
	dependencies.length+' modules are missing.',
	'Please run: npm install -g '+dependencies.join(' ')
    );
    process.exit(1);
}

opa_dependencies = opa_dependencies.filter(function(dependency, index, array) {
    // console.log('Checking', dependency, '...');
    try {
        module.require(dependency);
	return false;
    } catch(e) {
        return (e.code === 'MODULE_NOT_FOUND');
    }
});

if (opa_dependencies.length > 0) {
    console.error('Opa dependencies are missing, make sure your NODE_PATH is correctly set up. You can have a look at the head of this file for hints about where Opa modules might be installed.');
    process.exit(1);
}
