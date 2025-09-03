bash -euo pipefail <<'BASH'
REGION=${REGION:-us-east-1}; export AWS_DEFAULT_REGION="$REGION" AWS_PAGER=""
TABLE=Purchases

say(){ printf "\n==> %s\n" "$*"; }

say "Recreating DynamoDB table: $TABLE"
aws dynamodb delete-table --table-name "$TABLE" >/dev/null 2>&1 || true
aws dynamodb wait table-not-exists --table-name "$TABLE" >/dev/null 2>&1 || true

aws dynamodb create-table \
  --table-name "$TABLE" \
  --attribute-definitions AttributeName=CustomerID,AttributeType=N AttributeName=PurchaseDate,AttributeType=S \
  --key-schema AttributeName=CustomerID,KeyType=HASH AttributeName=PurchaseDate,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST >/dev/null
aws dynamodb wait table-exists --table-name "$TABLE"

say "Loading sample data"
aws dynamodb batch-write-item --request-items '{
  "'"$TABLE"'": [
    {"PutRequest":{"Item":{"CustomerID":{"N":"1"},"CustomerName":{"S":"Jack"},"PurchaseDate":{"S":"11-08-2024"},"Item1":{"S":"Beer"}}}},
    {"PutRequest":{"Item":{"CustomerID":{"N":"1"},"CustomerName":{"S":"Jack"},"PurchaseDate":{"S":"14-08-2024"},"Item1":{"S":"Coke"},"Item2":{"S":"Pie"}}}},
    {"PutRequest":{"Item":{"CustomerID":{"N":"2"},"CustomerName":{"S":"Lucy"},"PurchaseDate":{"S":"11-08-2024"},"Item1":{"S":"Coffee"},"Item2":{"S":"Sandwich"}}}},
    {"PutRequest":{"Item":{"CustomerID":{"N":"2"},"CustomerName":{"S":"Lucy"},"PurchaseDate":{"S":"13-08-2024"},"Item1":{"S":"Sandwich"},"Item2":{"S":"Coke"}}}},
    {"PutRequest":{"Item":{"CustomerID":{"N":"3"},"CustomerName":{"S":"Lucy"},"PurchaseDate":{"S":"14-08-2024"},"Item1":{"S":"Burger"},"Item2":{"S":"Coke"}}}}
  ]}' >/dev/null

say "Records that include Coke"
aws dynamodb scan \
  --table-name "$TABLE" \
  --filter-expression 'contains(Item1, :c) OR contains(Item2, :c)' \
  --expression-attribute-values '{":c":{"S":"Coke"}}' \
  --projection-expression 'CustomerID, CustomerName, PurchaseDate, Item1, Item2' \
  --output table
BASH
