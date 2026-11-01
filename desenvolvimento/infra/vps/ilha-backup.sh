#!/bin/sh
# /opt/ilha/backup.sh — cópia diária dos mundos (cron do usuário root, 04:30). Guarda 14 dias.
set -eu
DEST=/opt/ilha/backups
mkdir -p "$DEST"
tar -czf "$DEST/mundos-$(date +%Y%m%d).tar.gz" -C /opt/ilha dados
find "$DEST" -name 'mundos-*.tar.gz' -mtime +14 -delete
