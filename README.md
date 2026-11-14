# 玉桂狗征女朋友 · Cinnamoroll is looking for a girlfriend

**Live site:** https://jgoetzmann.github.io/evil-cinnamoroll/

A one-page Chinese class blog (an ad for a boyfriend/girlfriend, 300–400字) that doubles as a very animated
website. Plain HTML, CSS and JavaScript: no build step, no dependencies. GitHub Pages serves it as it is.

```
index.html   the page and the blog text (the seven paragraphs are the assignment)
style.css    all styling
script.js    the stock chart, mini-games, sparkles, application form
images/      Cinnamoroll photos (supplied) + 5 hobby photos from Wikimedia Commons
fonts/       Nunito (Latin) and ZCOOL KuaiLe (Chinese headings), both SIL OFL, subsetted
```

## GitHub Pages

The site is served straight from the `main` branch. In the repo on GitHub:
**Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)` → Save.**
After about a minute it is live at `https://<your-username>.github.io/evil-cinnamoroll/`.

## Try it locally

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

## What is on the page

- **Stock chart:** a spoof price history of 玉桂芯片 (CINN). It plays like a movie, with Cinnamoroll's little plane riding the
  line. Hover for a tooltip, drag the slider (arrow keys work), click a news pin, or press *If you apply…* for a made-up
  rebound. A table view is under the news timeline. All data is generated from a fixed seed in `script.js`: change the
  `KEYFRAMES` and `EVENTS` to rewrite the story.
- **Mini-games:** find his keys, the three-rolls-a-day tracker, the fish test, the homework-fear slider, the outfit
  fitting room (he always rejects it), the application checker and the laugh test.
- **Reading tools** (bottom left): hide/show the pinyin + English glosses, and highlight the grammar patterns
  (hover a highlight for its meaning).
- The contact form is a demo: nothing is sent or stored.

## No English on the page

Every label, button, caption and chart annotation is emoji or Chinese (section titles: 吃饭的习惯, 学校的打算, 购物标准,
女朋友的标准, 发送爱的邮件 …). The only Latin letters left are the pinyin glosses, `GPU` (it is in the blog text) and the
photo credits. Little Cinnamoroll faces (cropped from the supplied photos) "say" the game messages.

## Editing the blog text

The seven paragraphs live in `index.html` inside `<p class="zh">`. Glosses are `<span class="gloss">(…)</span>` and grammar
patterns are `<mark class="g" title="…">`. The heading font is a subset containing only the characters used when it was
built, so any new Chinese character falls back to a system font (it still displays; it just isn't in the cute font).

## Credits and licences

- Cinnamoroll (玉桂狗) © Sanrio Co., Ltd. This is a non-commercial student fan page; the artwork was supplied by the author.
- Photos from Wikimedia Commons (resized and converted to WebP):
  [Cinnamon roll – Clifton Road Coffee](https://commons.wikimedia.org/wiki/File:Cinnamon_roll_-_Clifton_Road_Coffee_2026-03-17.jpg)
  (Andy Li, CC0) ·
  [AMD Fiji GPU package](https://commons.wikimedia.org/wiki/File:AMD_Fiji_GPU_package_with_GPU,_HBM_memory_and_interposer.jpg)
  (C. Spille / pcgameshardware.de, CC BY-SA 4.0) ·
  [AMD3101E](https://commons.wikimedia.org/wiki/File:AMD3101E.jpg) (Mister rf, CC BY-SA 4.0) ·
  [Electrical Engineering Lab Station](https://commons.wikimedia.org/wiki/File:Electrical_Engineering_Lab_Station_(3955361228).jpg)
  (JohnRH4, CC BY-SA 2.0) ·
  [Caviar 2340 Hard Drive Circuit Board](https://commons.wikimedia.org/wiki/File:Caviar_2340_Hard_Drive_Circuit_Board_Side_1.jpg)
  (ComputerUserUser, CC0).
- Fonts: [Nunito](https://fonts.google.com/specimen/Nunito) and [ZCOOL KuaiLe](https://fonts.google.com/specimen/ZCOOL+KuaiLe), SIL Open Font License 1.1.
