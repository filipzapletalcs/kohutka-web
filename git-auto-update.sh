#!/bin/bash

# Git Auto-Update Script for Docker Container
# Automaticky stahuje změny z git repo a rebuilds Docker kontejner

set -e

# Konfigurace
REPO_DIR="/Users/filipzapletal/Kohutka_web/kohutka-web"
BRANCH="main"
CONTAINER_NAME="kohutka-web"
IMAGE_NAME="kohutka-web"
CHECK_INTERVAL=60  # Kontrola každých 60 sekund

echo "🔄 Starting Git Auto-Update Service..."
echo "📂 Repository: $REPO_DIR"
echo "🌿 Branch: $BRANCH"
echo "⏱️  Check interval: ${CHECK_INTERVAL}s"
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

        # Rebuild Docker image
        echo "🏗️  Rebuilding Docker image..."
        docker build -t $IMAGE_NAME .

        # Stop and remove old container
        echo "🛑 Stopping old container..."
        docker stop $CONTAINER_NAME > /dev/null 2>&1 || true
        docker rm $CONTAINER_NAME > /dev/null 2>&1 || true

        # Start new container
        echo "🚀 Starting new container..."
        docker run -d \
            --name $CONTAINER_NAME \
            -p 3000:3000 \
            --env-file .env \
            --restart unless-stopped \
            $IMAGE_NAME

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
