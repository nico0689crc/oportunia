#!/bin/bash

# Script para crear planes de suscripción en Mercado Pago
# Este script crea los planes Pro y Elite que se usarán para las suscripciones recurrentes

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Creando Planes de Suscripción en Mercado Pago ===${NC}\n"

# Verificar que existe el token
if [ -z "$MP_TEST_ACCESS_TOKEN" ]; then
    echo -e "${RED}Error: MP_TEST_ACCESS_TOKEN no está configurado${NC}"
    echo "Por favor, configura la variable de entorno:"
    echo "export MP_TEST_ACCESS_TOKEN='tu_token_aqui'"
    exit 1
fi

# URL base
API_URL="https://api.mercadopago.com/preapproval_plan"

# Obtener APP_URL desde .env.local
if [ -f ".env.local" ]; then
    export $(grep NEXT_PUBLIC_APP_URL .env.local | xargs)
fi

APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"

echo -e "${YELLOW}Usando APP_URL: ${APP_URL}${NC}\n"

# ============================================
# PLAN PRO
# ============================================
echo -e "${YELLOW}Creando Plan PRO...${NC}"

PRO_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $MP_TEST_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Suscripción Oportunia - Plan Pro",
    "auto_recurring": {
      "frequency": 1,
      "frequency_type": "months",
      "transaction_amount": 45000,
      "currency_id": "ARS"
    },
    "back_url": "'"$APP_URL"'/dashboard/billing/success"
  }')

# Verificar si hubo error
if echo "$PRO_RESPONSE" | grep -q "error"; then
    echo -e "${RED}Error al crear Plan Pro:${NC}"
    echo "$PRO_RESPONSE" | jq '.'
else
    PRO_PLAN_ID=$(echo "$PRO_RESPONSE" | jq -r '.id')
    echo -e "${GREEN}✓ Plan Pro creado exitosamente${NC}"
    echo -e "  ID: ${GREEN}$PRO_PLAN_ID${NC}"
    echo ""
fi

# ============================================
# PLAN ELITE
# ============================================
echo -e "${YELLOW}Creando Plan ELITE...${NC}"

ELITE_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $MP_TEST_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Suscripción Oportunia - Plan Elite",
    "auto_recurring": {
      "frequency": 1,
      "frequency_type": "months",
      "transaction_amount": 90000,
      "currency_id": "ARS"
    },
    "back_url": "'"$APP_URL"'/dashboard/billing/success"
  }')

# Verificar si hubo error
if echo "$ELITE_RESPONSE" | grep -q "error"; then
    echo -e "${RED}Error al crear Plan Elite:${NC}"
    echo "$ELITE_RESPONSE" | jq '.'
else
    ELITE_PLAN_ID=$(echo "$ELITE_RESPONSE" | jq -r '.id')
    echo -e "${GREEN}✓ Plan Elite creado exitosamente${NC}"
    echo -e "  ID: ${GREEN}$ELITE_PLAN_ID${NC}"
    echo ""
fi

# ============================================
# RESUMEN
# ============================================
echo -e "\n${YELLOW}=== Resumen ===${NC}"
echo ""
echo "Agrega estas variables a tu archivo .env.local:"
echo ""
echo -e "${GREEN}MP_PLAN_PRO_ID=$PRO_PLAN_ID${NC}"
echo -e "${GREEN}MP_PLAN_ELITE_ID=$ELITE_PLAN_ID${NC}"
echo ""
echo "Luego, actualiza también las variables en Vercel/producción."
