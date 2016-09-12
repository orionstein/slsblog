#[macro_use]
extern crate neon;
#[macro_use]
extern crate horrorshow;

use neon::vm::{Call, JsResult, Module};
use neon::js::JsString;
use horrorshow::prelude::*;

fn build(call: Call) -> JsResult<JsString> {
    let scope = call.scope;
    let titlee = "Not Safe for Production";
    let actual = html! {
        html {
            head {
                title { : titlee }
            }
            body {
                // attributes
                h1(id="heading") {
                    // Insert escaped text
                    : "Hello! This is <html />"
                }
                p {
                    // Insert raw text (unescaped)
                    : raw!("Let's <i>count</i> to 10!")
                }
                ol(id="count") {
                    // You can embed for loops, while loops, and if statements.
                    @ for i in 0..10 {
                        li(first? = (i == 0)) {
                            // Format some text.
                            : format_args!("{}", i+1)
                        }
                    }
                }
                // You need semi-colons for tags without children.
                br; br;
                p {
                    // You can also embed closures.
                    |tmpl| {
                        tmpl << "Easy!";
                    }
                }
            }
        }
    }.into_string().unwrap();
    let a_slice: &str = &actual[..];
    Ok(JsString::new(scope, a_slice).unwrap())
}

register_module!(m, {
    m.export("build", build)
});
