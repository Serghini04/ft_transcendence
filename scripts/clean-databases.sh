#!/bin/bash

# Clean all databases - use this to start fresh
# WARNING: This will delete all user data, messages, and game history!

echo "⚠️  WARNING: This will delete ALL databases and user data!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted"
    exit 1
fi

echo "🗑️  Deleting databases..."

# Remove database files
sudo rm -f ./app/backend/services/userAuth/src/db/database.db
sudo rm -f ./app/backend/services/game/src/db/game.sqlite
sudo rm -f ./app/backend/services/chat/src/db/chat.sqlite

# Remove any SQLite journal files
sudo rm -f ./app/backend/services/userAuth/src/db/*.db-journal
sudo rm -f ./app/backend/services/game/src/db/*.sqlite-journal
sudo rm -f ./app/backend/services/chat/src/db/*.sqlite-journal

echo "✅ All databases deleted!"
echo ""
echo "Next steps:"
echo "  1. Start containers: make up"
echo "  2. If you get 'readonly database' errors, run: ./scripts/fix-db-permissions.sh"
