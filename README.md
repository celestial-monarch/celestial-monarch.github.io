# Narendra Sharma — Portfolio website

A free, fast portfolio site. **You only ever touch two things:**

| What | Where |
|---|---|
| Your work (images) and your CV | the `portfolio/` folder |
| Your name, links, section titles | `site.config.json` |

Everything else is automatic. Your original image files are never changed: the site makes
small, web-friendly WebP copies of them (about 190 MB of originals → about 14 MB on the site).

```
portfolio/
  Clo/          ← each folder is a section of the website
  Branding/
  3D/
  cv/           ← put your CV PDF here (only one)
site.config.json
```

---

## Everyday changes

### Add new work
Drop the image (`.jpg`, `.png`, `.webp`, `.tif`) into the right folder inside `portfolio/`.
The file name becomes the title: `blueHoodie.png` → "Blue Hoodie", `gym-logo-02.jpg` → "Gym Logo 02".

### Replace a piece of work
Put the new file in with the **same file name** as the old one and overwrite it.

### Remove a piece of work
Delete the file from the folder.

### Change your CV
Delete the old PDF from `portfolio/cv/` and put the new one in. Any file name works.
Keep just one PDF in that folder.

### Change titles, add captions, or change the order
Each section folder has an optional `_details.txt`. Remove the `#` from a line and edit it:

```
loungeChair.png | Lounge Chair | Modelled and rendered in Blender
```

The order of the lines is the order on the website.

### Add a whole new section
Make a new folder inside `portfolio/` (for example `portfolio/Illustration/`) and put images in it.
It appears on the site automatically. To give it a nicer title, a description, or move it up or down,
add it to `sections` in `site.config.json`.

### Change your name, intro, LinkedIn or Google Drive link
Edit `site.config.json`. Links that still say `REPLACE` are hidden on the site until you fill them in.

---

## Publishing the changes

### Option A: in the browser (nothing to install)
1. Open your repository on github.com and go into `portfolio/`, then the folder you want.
2. **Add file → Upload files**, drag your images in, then press **Commit changes**.
   To remove one: open the file, click the **⋯** menu, choose **Delete file**.
3. Wait 1–2 minutes. The site updates by itself (see the **Actions** tab for progress).

Uploads through the browser are limited to 25 MB per file. Use Option B for bigger files.

### Option B: from your PC
After changing files in the `portfolio/` folder, run in this project folder:

```
git add -A
git commit -m "Update portfolio"
git push
```

### Preview on your PC before publishing (optional)
Requires [Node.js](https://nodejs.org) (free). First time only: `npm install`. Then:

```
npm run dev
```

and open http://localhost:5173.

---

## One-time setup: putting the site online for free

1. Create a free account at [github.com](https://github.com).
2. Create a **new repository** (for example `portfolio`), set it to **Public**, and don't add a README.
3. Push this project to it (GitHub shows the exact commands after you create the repository).
4. In the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
5. Open the **Actions** tab and wait for the green tick. Your site is at
   `https://YOUR-USERNAME.github.io/portfolio/`.

Tip: name the repository `YOUR-USERNAME.github.io` and the address becomes simply
`https://YOUR-USERNAME.github.io`.

---

## For the curious (what's inside)

- **Vite + plain JavaScript.** No framework.
- `scripts/build-content.mjs` reads `portfolio/`, makes the WebP copies with
  [sharp](https://sharp.pixelplumbing.com) (a 900 px thumbnail and a 2400 px full-screen version
  of each image) and writes the list of works for the page. It runs automatically before
  `npm run dev` and `npm run build`.
- `src/main.js` and `src/style.css` are the page: gallery, sections and the full-screen viewer
  (arrow keys, swipe on phones, Esc to close).
- `.github/workflows/deploy.yml` rebuilds and publishes the site on every push to `main`.
