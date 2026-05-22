# Acrocraft

**Turn any PDF into a fillable form, right in your browser.**

Drop in a PDF, draw boxes where people should type, check, or sign, and download a new PDF that anyone can fill out in Adobe Acrobat, Preview, or any other PDF reader.

Nothing leaves your computer. There's no account, no upload, no cloud — the whole thing runs locally.

---

## What you can do with it

- Open any PDF (a contract, a form, a worksheet…).
- Draw fields directly on the page:
  - **Text box** — for names, dates, anything typed
  - **Checkbox** — for yes/no boxes
  - **Radio button** — for "pick one" options
  - **Dropdown** — for a list of choices
  - **Signature field** — for signing
- Move, resize, rename, or delete fields anytime.
- Open a PDF that already has form fields and keep editing them.
- Save a new PDF with all the fields built in. Anyone you send it to can fill it out.

---

## How to run it on your computer

You only need to do the **first-time setup** once. After that, "every time you want to use it" is the part you repeat.

### First-time setup (about 5 minutes)

**1. Install Node.js**

Node.js is a small program the app needs in order to run. It's free and made by a non-profit.

- Go to https://nodejs.org/
- Click the big green button that says **LTS** (it stands for "Long Term Support" — the stable version)
- Open the file you downloaded and follow the installer. Keep clicking "Next" / "Continue" — the defaults are fine.

**2. Download this project**

If someone sent you the project as a folder (or a `.zip` file), put it somewhere easy to find, like your Desktop. If it's a `.zip`, double-click it to unzip first.

**3. Open a terminal in the project folder**

A "terminal" is a window where you type commands. Don't worry — you'll only type a few short ones.

- **On a Mac:** Open the project folder in Finder. Right-click the folder and choose **"New Terminal at Folder"**. (If you don't see that option, open the Terminal app from Applications → Utilities, then drag the project folder into the Terminal window and press Enter.)
- **On Windows:** Open the project folder in File Explorer. Click in the address bar at the top, type `cmd`, and press Enter. A black window will open — that's the terminal.

**4. Install the app's pieces**

In the terminal, type this and press Enter:

```
npm install
```

You'll see a lot of text scroll by for a minute or two. That's normal — it's downloading the building blocks the app needs. When it stops and you can type again, you're done.

You only ever have to do this once.

### Every time you want to use the app

**1. Open a terminal in the project folder** (same as step 3 above).

**2. Type this and press Enter:**

```
npm run dev
```

After a few seconds you'll see a message like:

```
Local:   http://localhost:5173/
```

**3. Open that link in your web browser** (you can click it, or copy-paste it into Chrome / Safari / Edge / Firefox).

That's the app! Drop a PDF on the page and start drawing fields.

**4. When you're done**, go back to the terminal and press **Ctrl + C** (on both Mac and Windows) to stop the app. You can close the terminal window too.

---

## Using the app

1. **Drop a PDF** onto the big drop zone (or click it to pick a file).
2. **Click and drag** on the page to draw a box where you want a field.
3. A little dialog pops up — pick the field type (text, checkbox, etc.), give it a name, and click confirm.
4. Use the **sidebar on the left** to switch pages, see all your fields, or remove ones you don't want.
5. When everything looks right, click **Export** in the sidebar. Your browser will save a new PDF with the fields built in.
6. Open that new PDF in any PDF reader to test it — the fields should be fillable.

---

## Troubleshooting

**"npm is not recognized" or "command not found: npm"**
Node.js isn't installed yet, or your terminal was open before you installed it. Close the terminal window, open a new one, and try again. If it still doesn't work, install Node.js from https://nodejs.org/.

**On Windows, PowerShell says something about "execution policy"**
The easiest fix is to use `cmd` instead of PowerShell. In File Explorer, click the address bar, type `cmd`, and press Enter — then run the commands in that window.

**The browser page is blank or won't load**
Make sure the terminal is still running (it should show "Local: http://localhost:5173/"). If you closed it, just run `npm run dev` again.

**The link doesn't open**
Copy the address (`http://localhost:5173/` or whatever number it shows) and paste it into your browser's address bar manually.

---

## For developers

This is a Vite + React 19 + TypeScript app. PDF rendering uses `pdfjs-dist`, field drawing uses `react-konva`, AcroForm import/export uses `pdf-lib`, and state is managed with `zustand`.

```
src/
  components/   UI (drop zone, field canvas, dialog, sidebar)
  lib/          PDF rendering, AcroForm import/export
  store/        zustand store
  types/        shared types
```

Scripts:

```bash
npm run dev      # dev server with HMR
npm run build    # type-check + production build
npm run preview  # preview the production build
npm run lint     # ESLint
```
