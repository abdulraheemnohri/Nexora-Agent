from app.db import connect, audit

def list_skills():
    with connect() as db:
        return [dict(row) for row in db.execute("SELECT * FROM skills ORDER BY id DESC")]

def propose(name: str, description: str, instructions: str):
    with connect() as db:
        cur = db.execute("INSERT INTO skills(name,description,instructions,status) VALUES(?,?,?,'proposed')",(name,description,instructions))
        sid = cur.lastrowid
    audit("skill.proposed",f"id={sid};name={name}")
    return next(x for x in list_skills() if x["id"] == sid)

def test_skill(skill_id: int):
    with connect() as db:
        row = db.execute("SELECT * FROM skills WHERE id=?",(skill_id,)).fetchone()
    if not row:
        raise LookupError("Skill not found")
    instructions = row["instructions"].lower()
    issues = []
    if len(instructions.strip()) < 10:
        issues.append("Instructions are too short")
    risky_patterns = ("rm -rf", "subprocess", "os.system", "exec(", "eval(", "curl | sh", "wget | sh")
    if any(pattern in instructions for pattern in risky_patterns):
        issues.append("Potential executable/destructive content detected")
    return {"skill_id":skill_id,"passed":not issues,"issues":issues,"note":"Static checks only; no skill code is executed."}

def decide(skill_id: int, decision: str):
    with connect() as db:
        row = db.execute("SELECT * FROM skills WHERE id=?",(skill_id,)).fetchone()
    if not row:
        raise LookupError("Skill not found")
    if decision == "approve":
        result = test_skill(skill_id)
        if not result["passed"]:
            raise ValueError("Skill failed static checks: " + "; ".join(result["issues"]))
        status = "approved"
    elif decision == "reject":
        status = "rejected"
    else:
        raise ValueError("Decision must be approve or reject")
    with connect() as db:
        db.execute("UPDATE skills SET status=?,version=version+1 WHERE id=?",(status,skill_id))
    audit("skill."+status,f"id={skill_id}")
    return next(x for x in list_skills() if x["id"] == skill_id)

def rollback(skill_id: int):
    with connect() as db:
        cur = db.execute("UPDATE skills SET status='rolled_back',version=version+1 WHERE id=?",(skill_id,))
        if not cur.rowcount: raise LookupError("Skill not found")
    audit("skill.rolled_back",f"id={skill_id}")
    return next(x for x in list_skills() if x["id"] == skill_id)
