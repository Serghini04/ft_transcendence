#!/bin/bash

# Fix database permissions for all services
# Run this script after starting containers if you get "readonly database" errors

echo "🔧 Fixing database permissions..."

# User Auth database
if [ -f "./app/backend/services/userAuth/src/db/database.db" ]; then
    sudo chmod 666 ./app/backend/services/userAuth/src/db/database.db
    echo "✅ Fixed userAuth database permissions"
fi

# Game Service database
if [ -f "./app/backend/services/game/src/db/game.sqlite" ]; then
    sudo chmod 666 ./app/backend/services/game/src/db/game.sqlite
    echo "✅ Fixed game service database permissions"
fi

# Chat Service database
if [ -f "./app/backend/services/chat/src/db/chat.sqlite" ]; then
    sudo chmod 666 ./app/backend/services/chat/src/db/chat.sqlite
    echo "✅ Fixed chat service database permissions"
fi

# Fix directory permissions
sudo chmod 777 ./app/backend/services/userAuth/src/db/ 2>/dev/null
sudo chmod 777 ./app/backend/services/game/src/db/ 2>/dev/null
sudo chmod 777 ./app/backend/services/chat/src/db/ 2>/dev/null

echo "✅ All database permissions fixed!"
