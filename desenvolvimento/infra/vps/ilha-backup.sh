#!/bin/sh
# /opt/ilha/backup.sh — cópia dos mundos (cron do root: de hora em hora). Guarda 3 dias de cópias por hora.
set -u
DEST=/opt/ilha/backups
mkdir -p "$DEST"
ARQ="$DEST/mundos-$(date +%Y%m%d-%H).tar.gz"
# tar sai com 1 quando um arquivo muda durante a leitura (o servidor grava sem parar): a cópia ainda vale.
# Qualquer outra falha (disco cheio etc.): apaga a cópia ruim e NÃO apaga as antigas.
tar -czf "$ARQ" -C /opt/ilha dados
st=$?
if [ "$st" -gt 1 ] || ! gzip -t "$ARQ" 2>/dev/null; then rm -f "$ARQ"; echo "backup da ilha falhou ($st)" >&2; exit 1; fi
find "$DEST" -name 'mundos-*.tar.gz' -mmin +4320 -delete
