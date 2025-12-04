#!/bin/bash

# Color definitions
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
RESET='\033[0m'
BOLD='\033[1m'

# Help message
show_help() {
    echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════════╗${RESET}"
    echo -e "${BOLD}${CYAN}║        🚀 FT_TRANSCENDENCE - DevOps Makefile 🚀            ║${RESET}"
    echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════╝${RESET}"
    echo ""
    echo -e "${BOLD}🎮 Service Management:${RESET}"
    echo -e "  ${GREEN}make up${RESET}              - 🚀 Launch all services into orbit!"
    echo -e "  ${YELLOW}make down${RESET}            - 🛑 Bring everything back to Earth"
    echo -e "  ${BLUE}make restart${RESET}         - 🔄 Give services a fresh start"
    echo -e "  ${CYAN}make logs${RESET}            - 📜 Peek at what's happening inside"
    echo -e "  ${CYAN}make ps${RESET}              - 👀 See who's running the show"
    echo ""
    echo -e "${BOLD}🔧 Build & Maintenance:${RESET}"
    echo -e "  ${MAGENTA}make build${RESET}           - 🔨 Forge fresh Docker images"
    echo -e "  ${YELLOW}make clean${RESET}           - 🧹 Tidy up containers & volumes"
    echo -e "  ${MAGENTA}make re${RESET}              - ♻️  The ultimate do-over (fclean + build + up)"
    echo ""
    echo -e "${BOLD}🎨 Development Mode:${RESET}"
    echo -e "  ${CYAN}make dev${RESET}             - 🔧 Start frontend in dev mode (hot-reload on :5173)"
    echo -e "  ${CYAN}make dev-full${RESET}        - 🚀 Start full dev stack with all services"
    echo ""
    echo -e "${BOLD}🧪 Testing Zone:${RESET}"
    echo -e "  ${GREEN}make test-producer${RESET}   - 📤 Send a message through Kafka"
    echo -e "  ${GREEN}make test-consumer${RESET}   - 📥 Check what Kafka received"
    echo ""
    echo -e "${BOLD}⚠️  Danger Zone:${RESET}"
    echo -e "  ${RED}make stop-all${RESET}        - ⛔ Stop ALL containers (no mercy!)"
    echo -e "  ${RED}make delete-all${RESET}      - 💣 Nuke volumes & images"
    echo -e "  ${RED}make fclean${RESET}          - 🔥 BURN IT ALL! (Nuclear option)"
    echo ""
    echo -e "${YELLOW}💡 Tip: Start with 'make up' and explore from there!${RESET}"
}

# Start services message
msg_up_start() {
    echo -e "${GREEN}${BOLD}"
    echo "╔═══════════════════════════════════════╗"
    echo "║  🚀 LAUNCHING ALL SERVICES...        ║"
    echo "╚═══════════════════════════════════════╝${RESET}"
    echo -e "${CYAN}⚙️  Spinning up Kafka, Zookeeper, Prometheus, Grafana...${RESET}"
}

msg_up_complete() {
    echo ""
    echo -e "${GREEN}${BOLD}✨ BOOM! All systems are GO! 🎉${RESET}"
    echo -e "${YELLOW}👉 Try 'make ps' to see what's running${RESET}"
}

# Stop services message
msg_down_start() {
    echo -e "${YELLOW}${BOLD}"
    echo "╔═══════════════════════════════════════╗"
    echo "║  🛑 SHUTTING DOWN GRACEFULLY...      ║"
    echo "╚═══════════════════════════════════════╝${RESET}"
}

msg_down_complete() {
    echo ""
    echo -e "${GREEN}✓ All services have landed safely! 🛬${RESET}"
}

# Restart services message
msg_restart_start() {
    echo -e "${BLUE}${BOLD}🔄 Time for a fresh start! Restarting everything...${RESET}"
}

msg_restart_complete() {
    echo -e "${GREEN}✓ Services are back and feeling refreshed! 💪${RESET}"
}

# Build services message
msg_build_start() {
    echo -e "${MAGENTA}${BOLD}"
    echo "╔═══════════════════════════════════════╗"
    echo "║  🔨 BUILDING DOCKER IMAGES...        ║"
    echo "╚═══════════════════════════════════════╝${RESET}"
    echo -e "${CYAN}⏳ Grab a coffee, this might take a while...${RESET}"
}

msg_build_complete() {
    echo ""
    echo -e "${GREEN}${BOLD}✓ Build complete! Fresh images ready to roll! 📦${RESET}"
}

# Clean message
msg_clean_start() {
    echo -e "${YELLOW}${BOLD}🧹 Spring cleaning time! Removing containers & volumes...${RESET}"
}

msg_clean_complete() {
    echo -e "${GREEN}✨ Sparkly clean! Everything's tidied up! ${RESET}"
}

# Logs message
msg_logs() {
    echo -e "${CYAN}${BOLD}📜 Streaming logs... Press Ctrl+C to exit${RESET}"
}

# PS message
msg_ps() {
    echo -e "${CYAN}${BOLD}👀 Here's who's currently running:${RESET}"
}

# Test producer messages
msg_test_producer_start() {
    echo -e "${GREEN}${BOLD}🧪 Testing Kafka Producer... Sending test message! 📤${RESET}"
}

msg_test_producer_complete() {
    echo -e "\n${GREEN}${BOLD}✓ Message sent successfully! Producer is alive! 🎉${RESET}"
}

# Test consumer messages
msg_test_consumer_start() {
    echo -e "${GREEN}${BOLD}🧪 Testing Kafka Consumer... Fetching latest message! 📥${RESET}"
}

msg_test_consumer_complete() {
    echo -e "\n${GREEN}${BOLD}✓ Consumer is working like a charm! 🌟${RESET}"
}

# Stop all messages
msg_stop_all_start() {
    echo -e "${RED}${BOLD}"
    echo "╔═══════════════════════════════════════╗"
    echo "║  ⛔ EMERGENCY STOP ACTIVATED!        ║"
    echo "╚═══════════════════════════════════════╝${RESET}"
    echo -e "${YELLOW}⏹  Stopping all containers (no survivors!)...${RESET}"
}

msg_stop_all_complete() {
    echo -e "${GREEN}✓ All containers stopped!${RESET}"
}

msg_stop_all_none() {
    echo -e "${YELLOW}ℹ No running containers found. All quiet! 🤷${RESET}"
}

# Delete all messages
msg_delete_all_start() {
    echo ""
    echo -e "${RED}${BOLD}💣 DELETION MODE ACTIVATED! 💣${RESET}"
    echo -e "${RED}🗑️  Removing all volumes... Bye bye data!${RESET}"
}

msg_delete_all_volumes_done() {
    echo -e "${GREEN}✓ Volumes deleted!${RESET}"
}

msg_delete_all_volumes_none() {
    echo -e "${YELLOW}ℹ No volumes found. Already clean! ✨${RESET}"
}

msg_delete_all_images() {
    echo -e "${RED}🗑️  Removing project images... Making space!${RESET}"
}

msg_delete_all_complete() {
    echo -e "${GREEN}${BOLD}✓ Deletion complete! Everything is gone! 👻${RESET}"
}

# Full clean messages
msg_fclean_start() {
    echo ""
    echo -e "${RED}${BOLD}"
    echo "╔═══════════════════════════════════════╗"
    echo "║  🔥 NUCLEAR OPTION ACTIVATED! 🔥     ║"
    echo "║  ⚠️  THIS WILL DESTROY EVERYTHING!   ║"
    echo "╚═══════════════════════════════════════╝${RESET}"
    echo -e "${RED}💥 Removing containers, volumes, images, networks, cache...${RESET}"
}

msg_fclean_volumes() {
    echo -e "${RED}🗑️  Destroying volumes...${RESET}"
}

msg_fclean_volumes_done() {
    echo -e "${YELLOW}💀 Volumes obliterated!${RESET}"
}

msg_fclean_volumes_none() {
    echo -e "${YELLOW}ℹ No volumes to destroy${RESET}"
}

msg_fclean_images() {
    echo -e "${RED}🗑️  Erasing project images...${RESET}"
}

msg_fclean_networks() {
    echo -e "${RED}🗑️  Pruning networks...${RESET}"
}

msg_fclean_cache() {
    echo -e "${RED}🗑️  Clearing build cache...${RESET}"
}

msg_fclean_complete() {
    echo ""
    echo -e "${GREEN}${BOLD}✨ FULL CLEAN COMPLETE! ✨${RESET}"
    echo -e "${CYAN}It's like it never existed... 👻${RESET}"
}

# Rebuild messages
msg_rebuild_complete() {
    echo ""
    echo -e "${GREEN}${BOLD}"
    echo "╔═══════════════════════════════════════╗"
    echo "║  ♻️  FULL REBUILD COMPLETE! ♻️       ║"
    echo "║  🎉 EVERYTHING IS BRAND NEW! 🎉     ║"
    echo "╚═══════════════════════════════════════╝${RESET}"
    echo -e "${CYAN}Fresh start! All systems operational! 🚀${RESET}"
}
