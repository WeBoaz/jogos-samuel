#!/bin/sh
# /opt/ilha/backup.sh — cópia dos mundos (cron do root: de hora em hora). Guarda 3 dias de cópias por hora.
set -u
DEST=/opt/ilha/backups
mkdir -p "$DEST"
# tar sai com 1 quando um arquivo muda durante a leitura (o servidor grava sem parar): a cópia ainda vale
tar -czf "$DEST/mundos-$(date +%Y%m%d-%H).tar.gz" -C /opt/ilha dados || [ $? -eq 1 ]
find "$DEST" -name 'mundos-*.tar.gz' -mmin +4320 -delete
