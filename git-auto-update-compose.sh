#!/bin/bash

# Git Auto-Update Script for Docker Compose
# Automaticky stahuje změny z git repo a rebuilds pomocí docker-compose

set -e

# Konfigurace
REPO_DIR="$(pwd)"
BRANCH="main"
CHECK_INTERVAL=60  # Kontrola každých 60 sekund
COMPOSE_FILE="docker-compose.prod.yml"

echo "🔄 Starting Git Auto-Update Service (Docker Compose)..."
echo "📂 Repository: $REPO_DIR"
echo "🌿 Branch: $BRANCH"
echo "⏱️  Check interval: ${CHECK_INTERVAL}s"
echo "📄 Compose file: $COMPOSE_FILE"
echo ""

cd "$REPO_DIR"

# Funkce pro získání aktuálního commit hash
get_current_commit() {
    git rev-parse HEAD
}

# Uložení aktuálního commit hash
CURRENT_COMMIT=$(get_current_commit)

echo "📌 Current commit: ${CURRENT_COMMIT:0:7}"
echo ""

# Nekonečná smyčka pro kontrolu změn
while true; do
    # Fetch latest changes
    git fetch origin $BRANCH > /dev/null 2>&1

    # Získání remote commit hash
    REMOTE_COMMIT=$(git rev-parse origin/$BRANCH)

    # Porovnání
    if [ "$CURRENT_COMMIT" != "$REMOTE_COMMIT" ]; then
        echo "🔔 New changes detected!"
        echo "   Current: ${CURRENT_COMMIT:0:7}"
        echo "   Remote:  ${REMOTE_COMMIT:0:7}"
        echo ""

        # Pull changes
        echo "📥 Pulling changes..."
        git pull origin $BRANCH

        # Rebuild and restart using docker-compose
        echo "🏗️  Rebuilding and restarting services..."
        docker-compose -f $COMPOSE_FILE down
        docker-compose -f $COMPOSE_FILE build --no-cache
        docker-compose -f $COMPOSE_FILE up -d

        # Update current commit
        CURRENT_COMMIT=$(get_current_commit)

        echo "✅ Update completed! New version: ${CURRENT_COMMIT:0:7}"
        echo ""
    else
        echo "✓ No changes ($(date '+%H:%M:%S'))"
    fi

    # Čekání před další kontrolou
    sleep $CHECK_INTERVAL
done
