# translation-cloudant-icos
Language Translator, Cloudant and IBM Cloud Object storageを使用したNode.jsのサンプルコードです。

このアプリケーションはWebページより日本語のテキストファイルを送ると、以下を行います。

* Language Translatorで英訳
* 英訳から他の19言語に翻訳
* 翻訳ログとしてCloudant db に結果を保存
* 翻訳結果をファイルにしてIBM Object Storageに保存
* 翻訳結果をブラウザーに表示



## 含まれる IBM Cloudコンポーネント
* [Cloud Foundry SDK for Node.js](https://cloud.ibm.com/docs/runtimes/nodejs?topic=Nodejs-getting-started&locale=ja#getting-started):
サーバー・サイド JavaScript® アプリを簡単に開発、デプロイ、および拡張できます

* [Language Translator](https://www.ibm.com/watson/services/language-translator/):
IBM Watsonの翻訳サービス

* [Cloudant](https://www.ibm.com/jp-ja/cloud/cloudant):
Web、モバイル、IoT、サーバーレスの各アプリケーションのための、拡張性の高いJSON文書データベース

* [IBM Cloud Object Storage](https://www.ibm.com/jp-ja/cloud/object-storage):
柔軟でコスト効率が高く拡張性を備えた、非構造化データ向けのクラウド・ストレージ		

## 使用している主なテクノロジー
* [Node.js](https://nodejs.org/):
Node.js® は8 JavaScript エンジン で動作する JavaScript 環境です。 Node.js は、軽量で効率的に動作する非同期型のイベント駆動モデルを採用しています。Node.js のパッケージ管理マネージャである npm は、世界で最も大きなオープンソースのライブラリエコシステムです。

* [Vue.js](https://jp.vuejs.org/index.html) The Progressive JavaScript Framework

* [bootswatch](https://bootswatch.com/) オーブンソースの[Bootstrap](https://getbootstrap.com/)のテーマ

* [axios](https://github.com/axios/axios) ブラウザや node.js で動く Promise ベースのHTTPクライアント


# 前提条件
* IBM Cloudのアカウント    
* [Git Cilent](https://git-scm.com/downloads)
* ローカル環境で動かす場合は以下必要です:
    * [NodeJS](https://nodejs.org/en/)
 * IBM Cloud上で動かす場合は以下が必要です:
    * [IBM Cloud CLI](https://cloud.ibm.com/docs/cli?topic=cloud-cli-overview#overview)


# ローカル環境&IBM Cloud デプロイ 共通手順

### 1. リポジトリのクローン　

`translation-cloudant-icos` リポジトリをローカル環境にクローンします。ターミナル(コマンドウィンドウ)にて以下のコマンドを実行してください:

```
$ git clone https://github.com/kyokonishito/translation-cloudant-icos.git
```
### 2. IBM Cloud サービスの作成
IBM Cloudにログインして必要なサービスを作成します。

#### 2.1 Language Translatorサービスの作成
* [https://cloud.ibm.com/](https://cloud.ibm.com/)にアクセス
* ``リソースの作成`` をクリック
* ``Language Translator`` を検索
* 検索の結果として、``Language Translator`` が表示されるので選択します。
* 希望のプランを指定します。
* 右下にある ``作成`` ボタンをクリック 

#### 2.2 Cloudantサービスとdbの作成
(既に作成済みの場合は``Create Database``のみしてください)
* [https://cloud.ibm.com/](https://cloud.ibm.com/)にアクセス
* ``リソースの作成`` をクリック
* ``Cloudant`` を検索
* 検索の結果として、``Cloudant`` が表示されるので選択します。
* 希望のプランを指定します。
* ``Available authentication methods:``に`Use both legacy credencials and IAM`を設定
* 右下にある ``作成`` ボタンをクリック 
* `リソース・リスト`が表示された場合、`リソース・リスト`->`サービス`の状況が`Provisioned`になったら、作成したCloudantのサービスをクリック(状況が変わらない場合は、リロードしてみる)
* 作成完了したら``Launch Cloudant Dashboard``ボタンをクリック 
* 上のメニューバーの``Create Database``をクリック
* `fileinfo`とテキストボックスに入力して``Create``をクリック（`fileinfo`という名前のdbが作成されます。）

#### 2.3 IBM Cloud Object StorageサービスとBacketの作成
(既に作成済みの場合はバケットの作成のみしてください)
* [https://cloud.ibm.com/](https://cloud.ibm.com/)にアクセス
* ``リソースの作成`` をクリック
* ``IBM Cloud Object Storage`` を検索
* 検索の結果として、``オブジェクト・ストレージ`` が表示されるので選択します。
* 希望のプランを指定します。
* 右下にある ``作成`` ボタンをクリック 
* 作成完了したら``バケットの作成``ボタンをクリック 
* 固有のバケット名を記入して``バケットの作成``をクリック
   
   * 固有のバケットのネーミング・ルール：
     *  IBM Cloud Object Storage システム全体で固有である必要があります (ユーザー名と同様)
     * 個人情報 (名前、住所、金融またはセキュリティーの口座、SSN の一部) を使用してはいけません。
     * 先頭文字と最終文字は英数字にする必要があります (3 から 63 文字)。
     * 小文字、数字、連続していないドットとハイフンが使用できます。

   * この名前は後で使用するので、どこかにメモしておいてください。

* 作成完了した左のメニューから``パケット``の下の``構成``をクリック
* 表示されたエンドポイントのパブリックの値をどこかにコピーしておく。
* 左のメニューから``サービス資格情報``をクリック
* ``新規資格情報`` をクリックし、役割を``Writer``に設定、``追加``ボタンをクリック
* 追加完了したら、追加したサービス資格情報の``資格情報の表示``をクリックし、 "apikey"の値と"resource_instance_id"の値をどこかにコピーしておく。


## IBM Cloudへのデプロイ

### 1. ``ローカル環境&IBM Cloud デプロイ 共通手順`` `1`でクローンしたディレクトリにcdする
ターミナル(コマンドウィンドウ)にて以下のコマンドを実行してください:
```
$ cd translation-cloudant-icos.git
```
### 2. `manifest.yml` の編集

<>で囲まれた部分を自分の値に変更します。

```
applications:
- name: <PUT YOUR APP NAME>
memory: 256M
command: node app.js
path: .
buildpack: sdk-for-nodejs
env:
  ICOS_ENDPOINT: <PUT YOUR ICOS_ENDPOINT>
  ICOS_APIKEY: <PUT YOUR ICOS_APIKEY>
  ICOS_RESOURCE_INSTANCE_ID: '<ICOS_RESOURCE_INSTANCE_ID>'
  ICOS_BACKETNAME: <PUT YOUR ICOS_BACKETNAME>
  CLOUDANT_DBNAME: fileinfo
```
* `<PUT YOUR APP NAME>`: アプリケーションの名前、URLの最初の部分になるので、ユニークな名前になるようにする。スベースやアンダーバー、日本語は使用不可。

* `<PUT YOUR ICOS_ENDPOINT>`: 2.3でコピーしたパブリックエンドポイントの値
* `<PUT YOUR ICOS_APIKEY>`: 2.3でコピーしたapikeyの値
* `<ICOS_RESOURCE_INSTANCE_ID>`: 2.3でコピーしたresource_instance_idの値、元からある最初と最後のシングルクォーテーション(')はそのまま残す。
* `<PUT YOUR ICOS_BACKETNAME>`: 2.3で作成した固有のバケット名

### 3. IBM CloudへCLIでログイン
ターミナル(コマンドウィンドウ)にて以下のコマンドを実行してください:
```
$ ibmcloud login
```

### 4. CloudFoundry 環境をターゲットに設定
ターミナル(コマンドウィンドウ)にて以下のコマンドを実行してください:
```
ibmcloud target --cf
```
### 5. アプリケーションのプッシュ
ターミナル(コマンドウィンドウ)にて以下のコマンドを実行してください:
```
ibmcloud app push --no-start
```
`--no-start`はアプリケーションを開始させないオプションです。
サービスとの接続が未作成のため、次の手順で接続を作成してから開始します。

### 6. IBM Cloud Webコンソールでサービスの接続作成とアプリケーションの開始

* [https://cloud.ibm.com/](https://cloud.ibm.com/)にアクセス
* `ダッシュボード`　-> `リソースの要約`　-> `Cloud Foundry アプリ`をクリック
*  2で設定したアプリケーションの名前をクリック
* 左のメニューから`接続`をクリック
* `接続の作成`をクリック
* `Language Translator`のサービスにマウスを当て、`接続`ボタンをクリック
* `IAM対応サービスの接続`ダイアログで`接続`をクリック
* `アプリの再ステージ`ダイアログで`キャンセル`をクリック

* `接続の作成`をクリック
* `Cloudant`のサービスにマウスを当て、`接続`ボタンをクリック
* `IAM対応サービスの接続`ダイアログで`接続`をクリック
* `アプリの再ステージ`ダイアログで`キャンセル`をクリック
*  `経路`ボタンの右側のメニューから`開始`をクリックしてアプリケーションを開始

アプリケーションが稼働中になったら、`アプリURLにアクセス`をクリックしてアプリケーションにアクセスしましょう。


## ローカル環境で動かす

### 1. ``ローカル環境&IBM Cloud デプロイ 共通手順`` `1`でクローンしたディレクトリにcdする
ターミナル(コマンドウィンドウ)にて以下のコマンドを実行してください:
```
$ cd translation-cloudant-icos.git
```

### 2. default.jsonの作成
ターミナル(コマンドウィンドウ)にて以下のコマンドを実行してください(windowsの場合はcopyコマンドを使用してください):
```
$ cp config/sample.default.json config/default.json
```

### 3. .envの作成
ターミナル(コマンドウィンドウ)にて以下のコマンドを実行してください(windowsの場合はcopyコマンドを使用してください):
```
$ cp sample.env .env
```

### 4. IBM Cloud Webコンソールでサービスの資格情報の取得、default.jsonの設定
* [https://cloud.ibm.com/](https://cloud.ibm.com/)にアクセス
* `ダッシュボード`　-> `リソースの要約`　-> `サービス`をクリック
* `Language Translator`のサービスをクリック
* 資格情報の`API鍵`および`URL`の値を2で作成した`default.json`の`language_translator`のそれぞれ<PUT YOUR API KEY FOR LANGUAGE TRANSLATOR>と<PUT YOUR API KEY FOR LANGUAGE TRANSLATOR>に入れて保存してください。
```
 "language_translator": [
        {
            "credentials": {
                "apikey": "<PUT YOUR API KEY FOR LANGUAGE TRANSLATOR>",
                "url": "<PUT YOUR API KEY FOR LANGUAGE TRANSLATOR>"
            }
        }
    ],
```
* [https://cloud.ibm.com/](https://cloud.ibm.com/)にアクセス
* `ダッシュボード`　-> `リソースの要約`　-> `サービス`をクリック
* `Cloudant`のサービスをクリック
* 左のメニューから`サービス資格情報`をクリック
* `新規資格情報`ボタンをクリック
* `新規資格情報の追加`ダイアログの`追加`を追加をクリック
*  追加された資格情報の`資格情報の表示`をクリック
*  "apikey"と"url"の値を2で作成した`default.json`の`cloudantNoSQLDB`のそれぞれ<PUT YOUR API KEY FOR CLOUDANT>と<PUT YOUR API KEY FOR CLOUDANT>に入れて保存してください。
```
"cloudantNoSQLDB": [
        {
                "credentials": {
                "apikey": "<PUT YOUR API KEY FOR CLOUDANT>",
                "url": "<PUT YOUR API KEY FOR CLOUDANT>"
            }
        }
    ]
```

### 5. .envの設定
`.env`に値を設定し保存します。

```
ICOS_ENDPOINT=PUT_YOUR_ICOS_ENDPOINT
ICOS_APIKEY=PUT_YOUR_ICOS_APIKEY
ICOS_RESOURCE_INSTANCE_ID=PUT_YOUR_ICOS_RESOURCE_INSTANCE_ID
ICOS_BACKETNAME=PUT_YOUR_ICOS_BACKETNAME
CLOUDANT_DBNAME=fileinfo
```

* `PUT YOUR ICOS_ENDPOINT`: 2.3でコピーしたパブリックエンドポイントの値
* `PUT YOUR ICOS_APIKEY`: 2.3でコピーしたapikeyの値
* `ICOS_RESOURCE_INSTANCE_ID`: 2.3でコピーしたresource_instance_idの値
* `PUT YOUR ICOS_BACKETNAME`: 2.3で作成した固有のバケット名


### 6. アプリケーションの起動
ターミナル(コマンドウィンドウ)にて以下のコマンドを実行してください:

```
$ npm install
$ npm start
```

アプリケーションが稼働したら、Webブラウザーで``http://localhost:3000/`` にアクセスしてアプリケーションを確認しましょう。




