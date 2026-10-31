#!/usr/bin/env python3
"""Gera um novo código de configuração do primeiro acesso e grava só o hash em _app/config-publica.php.
O código aparece UMA vez na tela: anote e não coloque em nenhum arquivo do repositório."""
import hashlib, os, re, secrets
alfa = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
cod = "".join(secrets.choice(alfa) for _ in range(20))
p = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "_app", "config-publica.php")
s = open(p, encoding="utf-8").read()
s = re.sub(r"const CODIGO_CONFIG_SHA256 = '[0-9a-f]*';", f"const CODIGO_CONFIG_SHA256 = '{hashlib.sha256(cod.encode()).hexdigest()}';", s)
open(p, "w", encoding="utf-8").write(s)
print("Novo código de configuração:", "-".join(cod[i:i + 5] for i in range(0, 20, 5)))
