#!/bin/bash
# Auto-answer drizzle-kit push prompts by sending Enter keys

cd /home/ubuntu/orbidut

# Use unbuffer to handle interactive prompts
(
  for i in {1..50}; do
    echo ""
    sleep 0.2
  done
) | pnpm drizzle-kit push
