port module Main exposing (..)

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Html.Lazy exposing (..)
import Debug exposing (log)
import Task
import Http exposing (..)
import Maybe exposing (..)
import String exposing (..)
import Dict exposing (..)
import Json.Encode exposing (..)
import Json.Decode exposing (..)

import Markdown

main =
  Html.program
    { init = init
    , view = view
    , update = update
    , subscriptions = subscriptions
    }

type alias Model =
  { key: String
  , author: String
  , title: String
  , snippet: String
  , url: String
  , content: String
  , tags: String }

init : (Model, Cmd Msg)
init =
  (Model "" "" "" "" "" "" "", Cmd.none)

view : Model -> Html Msg
view model =
  let 
    markdownHtml =
      Markdown.toHtml [] model.content
  in
    div [ class "col-12 row" ] [
      div [ class "col-4" ] [
        button [ class "btn-main btn", type_ "submit" ] [ text "Create Post" ]
      ]
      , div [ class "col-8" ] [ 
          div [ class "" ] [ 
            label [ class "col-form-label" ] [ text "Author Key" ]
            , div [ class "col-10" ] [ 
              input [ class "form-control", type_ "text", onInput UpdateKey ] []
            ]
          ]
        , Html.form [ onSubmit CreatePost ] [ 
          div [] [ 
            label [ class "col-2 col-form-label" ] [ text "Author Name" ]
            , div [ class "col-10" ] [ 
                input [ class "form-control", type_ "text", onInput UpdateName ] []
              ]
            ]
          , div [] [ 
              label [ class "col-2 col-form-label" ] [ text "Post Title" ]
            , div [ class "col-10" ] [ 
                input [ class "form-control", type_ "text", onInput UpdateTitle ] []
              ]
            ]
          , div [] [ 
              label [ class "col-2 col-form-label" ] [ text "Post Url" ]
            , div [ class "col-10" ] [ 
                input [ class "form-control", type_ "text", onInput UpdateUrl ] []
              ]
            ]
          , div [] [ 
              label [ class "col-2 col-form-label" ] [ text "Post Tags" ]
            , div [ class "col-10" ] [ 
                input [ class "form-control", type_ "text", onInput UpdateTags ] []
              ]
            ]
          , div [] [
              label [ class "col-2 col-form-label" ] [ text "Post Content" ]
            , div [ class "col-10" ] [ 
                textarea [ class "form-control", onInput UpdatePost ] []
              ]
            ]
          , div [] [
              label [ class "col-12" ] [ text "Post Preview"]
            , div [ class "col-12" ] [ markdownHtml ]
              ]
          , button [ class "btn-main btn", type_ "submit" ] [ text "Create Post" ]
          ]
        ]
      ]

getSnippet : String -> String
getSnippet c =
    slice 0 90 c

subscriptions : Model -> Sub Msg
subscriptions model =
  Sub.batch
  [ ]


createPost : Model -> Cmd Msg
createPost model =
  let
      url =
        "/admin/create"
      post =
        Json.Encode.object
          [ ("title", Json.Encode.string model.title)
          , ("author", Json.Encode.string model.author)
          , ("body", Json.Encode.string model.content)
          , ("snippet", Json.Encode.string model.snippet)
          , ("url", Json.Encode.string model.url)
          , ("tags", Json.Encode.string model.tags)
          ]
      data =
        jsonBody post
      headers =
        [ Http.header "X-Api-Key" (model.key)
        , Http.header "content-type" "application/json" ]
      req = request
          { method = "POST"
          , headers = headers
          , url = url
          , body = data
          , expect = expectString
          , timeout = Nothing
          , withCredentials = False
          }
  in
      Http.send PostCreated req

createResultDecoder: Json.Decode.Decoder String
createResultDecoder = 
  Json.Decode.string

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
  case msg of
    Toggle ->
      ( model, Cmd.none )
    CreatePost ->
      ( model, createPost model )
    PostCreated (Ok _) ->
      ( model, Cmd.none )
    PostCreated (Err _) ->
      ( model, Cmd.none )
    PostFailed _ ->
      ( model, Cmd.none )
    UpdateSnippet ->
      ({ model | snippet = (getSnippet model.content)}, Cmd.none )
    UpdateKey key ->
      ({ model | key = key }, Cmd.none)
    UpdateName name ->
      ({ model | author = name }, Cmd.none)
    UpdateUrl url ->
      ({ model | url = url }, Cmd.none)
    UpdateTitle title ->
      ({ model | title = title }, Cmd.none)
    UpdateTags tags ->
      ({ model | tags = tags }, Cmd.none)
    UpdatePost post ->
      ({ model | content = post }) |> update UpdateSnippet

type Msg
  = Toggle
  | UpdateSnippet
  | CreatePost
  | PostCreated (Result Http.Error String)
  | PostFailed Http.Error
  | UpdateKey String
  | UpdatePost String
  | UpdateName String
  | UpdateUrl String
  | UpdateTitle String
  | UpdateTags String
