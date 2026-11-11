import sys, os, re
src_dir = os.path.dirname(os.path.abspath(__file__))
css = open(os.path.join(src_dir, 'common.css')).read()
js = open(os.path.join(src_dir, 'common.js')).read()
def build(name):
    s = open(os.path.join(src_dir, name + '.src')).read()
    title, rest = s.split('\n', 1)
    body, script = rest.split('---SCRIPT---', 1)
    extra_css = ''
    if '---CSS---' in body:
        body, extra_css = body.split('---CSS---', 1)[0], body.split('---CSS---', 1)[1]
    html = f'''<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>{title.strip()}</title>
<style>
{css}{extra_css}
</style>
</head>
<body>
<div class="wrap">
  <a class="back" id="back" href="../../">← 목록으로</a>
{body.strip()}
</div>
<script>
(function(){{
{js}
{script.strip()}
}})();
</script>
<script src="../../practice/panel.js" defer></script>
</body>
</html>
'''
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site', 'sim', name)
    os.makedirs(out, exist_ok=True)
    open(os.path.join(out, 'index.html'), 'w').write(html)
    print('built', name)
for n in sys.argv[1:]: build(n)
