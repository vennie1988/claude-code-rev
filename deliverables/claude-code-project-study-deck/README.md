# Claude Code Project Study Deck

Artifacts in this folder:

- `claude-code-project-study-deck.pptx`: editable slide deck
- `deck.cjs`: PptxGenJS source used to generate the deck
- `rendered/`: per-slide PNG renders
- `montage.png`: contact sheet for quick review
- `pptxgenjs_helpers/`: copied helper utilities from the slides skill

Local rebuild steps:

```bash
npm install --cache .npm-cache
node deck.cjs
soffice --headless --convert-to pdf claude-code-project-study-deck.pptx --outdir rendered-pdf-test
pdftoppm -png rendered-pdf-test/claude-code-project-study-deck.pdf rendered/slide
./.venv/bin/python /Users/huhaoran/.codex/skills/slides/scripts/create_montage.py --input_dir rendered --output_file montage.png
```

Validation notes:

- layout overlap checks are embedded in `deck.cjs`
- font substitution check passed with `detect_font.py`
- LibreOffice raster verification required a non-sandboxed `soffice` run on this machine
