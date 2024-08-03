
import { serveDir } from "https://deno.land/std@0.223.0/http/file_server.ts";

//今まで入力された単語を記録する
let wordHistories = ["しりとり"];

Deno.serve(async (request) => {
    const pathname = new URL(request.url).pathname;
    console.log(`pathname: ${pathname}`);

    // GET /shiritori: 直前の単語を返す
    if (request.method === "GET" && pathname === "/shiritori") {
        wordHistories = ["しりとり"];
        return new Response(wordHistories.slice(-1)[0]);
    }

    // GET /atamatori: 直前の単語を返す
    if (request.method === "GET" && pathname === "/atamatori") {
        wordHistories = ["あたまとり"];
        return new Response(wordHistories.slice(-1)[0]);
    }

    
    // POST /shiritori or /atamatori: 次の単語を入力する
    if (request.method === "POST" && pathname === "/shiritori" || pathname === "/atamatori") {
        const requestJson = await request.json();
        const nextWord = requestJson["nextWord"];
        
        // /shiritoriの場合
        // wordHistoriesの末尾とnextWordの先頭が同一か確認
        if (wordHistories.slice(-1)[0].slice(-1) === nextWord.slice(0, 1) && pathname === "/shiritori") {

            // 入力された単語が「ひらがな」か判定
            if(isHiragana(nextWord) == false) {
                return new Response(
                    JSON.stringify({
                        "errorMessage": "ひらがな以外が含まれています。",
                        "errorCode": "10004"
                    }),
                    {
                        status: 403,
                        headers: { "Content-Type": "application/json; charset=utf-8" },
                    }
                );
            }
            
            // 入力された単語の末尾が「ん」か判定
            if(nextWord.slice(-1) === 'ん') {
                wordHistories = ["しりとり"];

                return new Response(
                    JSON.stringify({
                        "errorMessage": "語尾が「ん」です。",
                        "errorCode": "10002"
                    }),
                    {
                        status: 401,
                        headers: { "Content-Type": "application/json; charset=utf-8" },
                    }
                );
            }

            // 入力された単語が「過去に使われた」か判定
            if(wordHistories.includes(nextWord)) {
                wordHistories = ["しりとり"];

                return new Response(
                    JSON.stringify({
                        "errorMessage": "過去に使われた言葉です！",
                        "errorCode": "10003"
                    }),
                    {
                        status: 402,
                        headers: { "Content-Type": "application/json; charset=utf-8" },
                    }
                );
            }

            // 上記のエラー処理から外れたら、単語をwordHistoriesにpush
            wordHistories.push(nextWord);
        }

        // /atamatoriの場合
        // wordHistoriesの先頭とnextWordの末尾が同一か確認
        else if(wordHistories.slice(-1)[0].slice(0, 1) === nextWord.slice(-1) && pathname === "/atamatori") {
            if(isHiragana(nextWord) == false) {
                return new Response(
                    JSON.stringify({
                        "errorMessage": "ひらがな以外が含まれています。",
                        "errorCode": "10004"
                    }),
                    {
                        status: 403,
                        headers: { "Content-Type": "application/json; charset=utf-8" },
                    }
                );
            }
            if(wordHistories.includes(nextWord)) {
                wordHistories = ["あたまとり"];

                return new Response(
                    JSON.stringify({
                        "errorMessage": "過去に使われた言葉です！",
                        "errorCode": "10003"
                    }),
                    {
                        status: 402,
                        headers: { "Content-Type": "application/json; charset=utf-8" },
                    }
                );
            }
            wordHistories.push(nextWord);
        }

        // 同一でない単語の入力時に、エラーを返す
        else {
            return new Response(
                JSON.stringify({
                    "errorMessage": "前の単語に続いていません",
                    "errorCode": "10001"
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json; charset=utf-8" },
                }
            );
        }
        
        // 現在の単語を返す
        return new Response(wordHistories.slice(-1)[0]);
    }
    
    // POST /reset のとき、リセット処理
    if (request.method === "POST" && pathname === "/reset") {
        return new Response(wordHistories.slice(-1)[0]);
    }

    // ./public以下のファイルを公開
    return serveDir(
        request,
        {
            /*
            - fsRoot: 公開するフォルダを指定
            - urlRoot: フォルダを展開するURLを指定。今回はlocalhost:8000/に直に展開する
            - enableCors: CORSの設定を付加するか
            */
            fsRoot: "./public/",
            urlRoot: "",
            enableCors: true,
        }
    )
});

// strがひらがな以外を含むか判定
function isHiragana(str){
    str = (str==null)?"":str;
    if(str.match(/^[ぁ-んー　]*$/)){
      return true;
    }else{
      return false;
    }
  }

//deno run --allow-net --allow-read --watch --allow-env server.js