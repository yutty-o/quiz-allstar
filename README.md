# What is this?
志田さん送別会用の早押しクイズ


# Important URLs
* 出題画面
    1. https://quiz-dot-${YOUR_PROJECT}.appspot.com/static/q1.html
    2. https://quiz-dot-${YOUR_PROJECT}.appspot.com/static/q2.html
    3. https://quiz-dot-${YOUR_PROJECT}.appspot.com/static/q3.html
* 回答者画面
    * https://quiz-dot-rjb-yuune-153207.appspot.com


# 問題変更
* `/static/` 配下のHTMLを編集するだけ
* `<li class="page">` がスライドの各ページに相当する
    * `.ready-quiz` : 参加者が回答画面に移動できるようになる
    * `.quiz` : 出題画面
    * `.answers` : 正解確認画面
        * `.answer` : 正解の選択肢に付ける ← これで正答情報を管理
    * `.losers` : 脱落者確認画面（正解者のうち、最後の人が脱落）
    * `.winners` : 優勝者確認画面（最速回答者が優勝） ※1つのHTMLで最後の1問のみ
    * `.page` 以外に何もクラスをつけないと役割なしのただのページになる


# 出題者操作
* **次へ**ボタン: 次のスライド
* **全員復活**ボタン:
    * 全員不正解になったときに利用
    * 新たにクイズを開始するときに利用
        * 例）`q1.html` → `q2.html`
* **回答状況リセット**ボタン:
    * 問題が途中まで進行してしまったが、Periodの進行状況を完全にリセットする場合に利用
    * 中身的には全員復活ボタンと一緒


# 参加者登録
* 24時間のみ有効
* 名前の重複不可


# Requirements
## for Deployment
- `gcloud`
    - [install](https://cloud.google.com/sdk/downloads)
    - [initialize](https://cloud.google.com/sdk/docs/initializing)
    - [authorize](https://cloud.google.com/sdk/docs/authorizing)
- Some Python Libs

```sh
pip install -t ./lib -r requirements.txt
```

## for Development
- [App Engine SDK for Python](https://cloud.google.com/appengine/docs/python/download)

```sh
gcloud components update
gcloud components install app-engine-python
gcloud components install app-engine-python-extras
```


# Run on local
```sh
dev_appserver.py .
```


# Deploy
```sh
gcloud app deploy
```
