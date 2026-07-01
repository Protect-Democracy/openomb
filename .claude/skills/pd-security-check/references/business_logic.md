# Business logic vulnerabilities

Business logic vulnerabilities exploit flaws in application workflows and assumptions rather than technical implementation bugs. They bypass intended business rules — enabling double-spending, workflow skipping, or race conditions that corrupt data integrity.

## OWASP mapping

A04:2025 Insecure Design

## Vulnerable patterns

### Race conditions (TOCTOU)

```python
# UNSAFE: Check-then-act without atomicity — race condition
def transfer(from_account, to_account, amount):
    balance = Account.objects.get(id=from_account).balance  # Check
    if balance >= amount:
        Account.objects.filter(id=from_account).update(balance=balance - amount)  # Act
        Account.objects.filter(id=to_account).update(balance=F("balance") + amount)
    # Two concurrent requests can both pass the check before either updates
```

```javascript
// UNSAFE: Non-atomic inventory check
async function purchaseItem(userId, itemId) {
  const item = await Item.findById(itemId);
  if (item.stock > 0) {
    // Check
    item.stock -= 1; // Act — concurrent requests both see stock > 0
    await item.save();
    await createOrder(userId, itemId);
  }
}
```

### Workflow bypass

```python
# UNSAFE: Multi-step process without server-side state validation
@app.route("/api/checkout/confirm", methods=["POST"])
@login_required
def confirm_checkout():
    # Processes payment without verifying the user completed address/review steps
    return process_payment(request.user, request.json["cart_id"])
```

### Negative value manipulation

```python
# UNSAFE: No validation on quantity — negative values reverse the transaction
@app.route("/api/transfer", methods=["POST"])
def transfer():
    amount = request.json["amount"]  # Could be -1000
    sender.balance -= amount   # Subtracting negative = adding
    receiver.balance += amount  # Adding negative = subtracting
```

### Idempotency failures

```python
# UNSAFE: No duplicate submission protection
@app.route("/api/vote", methods=["POST"])
@login_required
def cast_vote():
    Vote.objects.create(user=request.user, candidate=request.json["candidate"])
    # Rapid double-click or replay sends two votes
```

## Safe patterns

### Atomic operations with database locks

```python
# SAFE: Atomic update with F() — no read-then-write race
from django.db.models import F
from django.db import transaction

@transaction.atomic
def transfer(from_id, to_id, amount):
    # SELECT FOR UPDATE prevents concurrent reads
    sender = Account.objects.select_for_update().get(id=from_id)
    if sender.balance >= amount:
        Account.objects.filter(id=from_id).update(balance=F("balance") - amount)
        Account.objects.filter(id=to_id).update(balance=F("balance") + amount)
    else:
        raise InsufficientFunds()
```

```javascript
// SAFE: Database transaction with row locking
async function purchaseItem(userId, itemId) {
  await db.transaction(async (trx) => {
    const item = await trx('items').where({ id: itemId }).forUpdate().first();
    if (item.stock > 0) {
      await trx('items').where({ id: itemId }).decrement('stock', 1);
      await trx('orders').insert({ userId, itemId });
    }
  });
}
```

### Server-side workflow state

```python
# SAFE: Validate workflow state at each step
@app.route("/api/checkout/confirm", methods=["POST"])
@login_required
def confirm_checkout():
    checkout = Checkout.objects.get(user=request.user, cart_id=request.json["cart_id"])
    if checkout.state != "reviewed":  # Must have completed prior steps
        return jsonify({"error": "Complete all checkout steps first"}), 400
    return process_payment(request.user, checkout)
```

### Input bounds validation

```python
# SAFE: Validate amount is positive and within limits
amount = request.json["amount"]
if not isinstance(amount, (int, float)) or amount <= 0 or amount > MAX_TRANSFER:
    return jsonify({"error": "Invalid amount"}), 400
```

### Idempotency keys

```python
# SAFE: Unique constraint prevents duplicate submissions
@app.route("/api/vote", methods=["POST"])
@login_required
def cast_vote():
    try:
        Vote.objects.create(user=request.user, candidate=request.json["candidate"])
    except IntegrityError:  # Unique constraint on (user, election)
        return jsonify({"error": "Already voted"}), 409
```

## Detection patterns

| Pattern                                                                 | What it finds                  |
| ----------------------------------------------------------------------- | ------------------------------ |
| `.get(` followed by `.update(` or `.save()` without `select_for_update` | Non-atomic read-then-write     |
| `if.*balance\|if.*stock` followed by update without transaction         | TOCTOU race condition          |
| Missing `@transaction.atomic` on financial operations                   | Non-atomic transactions        |
| No bounds check on `amount\|quantity\|price` from user input            | Potential negative value abuse |

## Framework protections

- **Django**: `F()` expressions for atomic field updates. `select_for_update()` for row locking. `transaction.atomic` for database transactions. `UniqueConstraint` for idempotency.
- **SQLAlchemy**: `with_for_update()` for row locking. Session transactions.
- **Database constraints**: `CHECK (amount > 0)`, `UNIQUE` constraints, foreign keys enforce business rules at the database level regardless of application code.

## False positive guidance

- Read-only operations — no TOCTOU risk.
- Calculations on server-controlled values (not user input) — negative manipulation not possible.
- Background jobs with built-in retry/deduplication mechanisms — idempotency handled at the job level.
- Single-user operations where concurrent access is impossible by design.

## Testing checklist

1. Do financial or inventory operations use database transactions with row locking?
2. Are multi-step workflows validated server-side at each step (not just the final step)?
3. Are user-supplied numeric values (amounts, quantities, prices) validated for positive bounds?
4. Are duplicate submissions prevented via unique constraints or idempotency keys?
5. Can any workflow step be skipped by directly calling a later endpoint?
