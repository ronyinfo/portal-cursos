<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Exportar - Portal de Cursos</title>
  <link rel="stylesheet" href="assets/css/style.css"/>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">📦 Exportar Conclusões</div>
      <div class="row">
        <a class="btn secondary" href="painel.html">Meu painel</a>
        <button class="btn danger" onclick="logout()">Sair</button>
      </div>
    </div>

    <div class="card">
      <p class="small">Aqui você exporta somente cursos concluídos. Depois você usa no Google Docs para montar o certificado.</p>
      <div class="hr"></div>

      <div class="row">
        <button class="btn" id="btnJson">Copiar JSON</button>
        <button class="btn secondary" id="btnCsv">Baixar CSV</button>
      </div>

      <div id="out" class="toast" style="display:none; white-space:pre-wrap; margin-top:12px;"></div>
    </div>
  </div>

  <script src="assets/js/app.js"></script>
  <script>
    const sess = requireAuth();
    const data = exportCompletions(sess.cpf);

    const out = document.getElementById("out");
    function show(text){
      out.style.display = "block";
      out.textContent = text;
    }

    function toCsv(rows){
      if(!rows.length) return "nome,cpf,curso,carga_horaria,periodo_inicio,periodo_fim,concluido_em,completion_id\n";
      const head = Object.keys(rows[0]);
      const esc = (v) => `"${String(v ?? "").replaceAll('"','""')}"`;
      const lines = [head.join(",")];
      for(const r of rows){
        lines.push(head.map(k => esc(r[k])).join(","));
      }
      return lines.join("\n") + "\n";
    }

    document.getElementById("btnJson").onclick = async () => {
      const text = JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(text);
      show("✅ JSON copiado para a área de transferência.\n\n" + text);
    };

    document.getElementById("btnCsv").onclick = () => {
      const csv = toCsv(data);
      const blob = new Blob([csv], { type:"text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conclusoes_${sess.cpf}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      show("✅ CSV gerado. Se não tiver curso concluído, o arquivo sai só com o cabeçalho.\n\n" + csv);
    };
  </script>
</body>
</html>
