#[macro_use]
extern crate neon;
extern crate handlebars;
extern crate rustc_serialize;
extern crate glob;
use neon::vm::{Call, JsResult, Module};
use neon::js::JsString;
use std::path::Path;
use handlebars::Handlebars;
use std::collections::BTreeMap;
use rustc_serialize::json::{Json, ToJson};
use glob::glob;

fn build(call: Call) -> JsResult<JsString> {
    let scope = call.scope;
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
    let dataJson = data.to_json();

    let pageString = handlebars.render("index", &dataJson).ok().unwrap();
    let pageSlice : &str = &pageString[..];
    Ok(JsString::new(scope, pageSlice).unwrap())
}

register_module!(m, {
    m.export("build", build)
});
