#[macro_use]
extern crate neon;
extern crate handlebars;
extern crate rustc_serialize;
extern crate glob;
extern crate markdown;
use neon::vm::{Call, JsResult, Module};
use neon::mem::Handle;
use neon::js::{JsString, JsArray, Key, JsObject, Object, Value, JsInteger};
use std::path::Path;
use handlebars::Handlebars;
use std::collections::BTreeMap;
use rustc_serialize::json::{Json, ToJson};
use glob::glob;

fn unescape(text: &str) -> String {
	text.replace("&amp;", "&")
		.replace("&lt;", "<")
		.replace("&quot;","\"")
		.replace("&#8217;","'")
		.replace("&gt;",">")
}

fn build(call: Call) -> JsResult<JsString> {
    let scope = call.scope;
    let obj: Handle<JsObject> = JsObject::new(scope);
    let postData = try!(try!(call.arguments.require(scope, 0)).check::<JsString>());
    let qq : &str = &postData.value()[..];
    let postDataC = markdown::to_html(qq);
    let v = &postDataC[..];
    let un = unescape(v);
    println!("{:?}", un);
    let mut handlebars = Handlebars::new();

    for entry in glob("./templates/**/*.hbs").expect("Failed to read glob pattern") { 
	    match entry {
		    Ok(path) => {
			    println!("{:?}", path.file_stem().unwrap());
			    let template_name = path.file_stem().unwrap().to_string_lossy().into_owned();
			    let template_slice : &str = &template_name[..]; 
			    handlebars.register_template_file(template_slice, path).ok().unwrap();
		    },
			    Err(e) => println!("{:?}", e),
	    }
    }

    let mut data: BTreeMap<String, Json> = BTreeMap::new();
    data.insert("title".to_string(), "base0".to_json());
    data.insert("content".to_string(), un.to_json());
    let dataJson = data.to_json();

    let pageString = handlebars.render("page", &dataJson).ok().unwrap();
    let pageSlice : &str = &pageString[..];
    Ok(JsString::new(scope, pageSlice).unwrap())
}

register_module!(m, {
    m.export("build", build)
});
