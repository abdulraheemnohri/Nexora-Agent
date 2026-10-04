from app.learning.skills import propose, test_skill, decide, rollback

def _use_test_database(monkeypatch, tmp_path):
    from app.config import get_settings
    monkeypatch.setenv("NEXORA_DATABASE_PATH",str(tmp_path/"test.db"))
    get_settings.cache_clear()
    return get_settings

def test_skill_lifecycle(tmp_path, monkeypatch):
    get_settings = _use_test_database(monkeypatch,tmp_path)
    item=propose("summarizer","Summarize notes","Read the user's notes and produce a concise summary.")
    assert test_skill(item["id"])["passed"]
    assert decide(item["id"],"approve")["status"] == "approved"
    assert rollback(item["id"])["status"] == "rolled_back"
    get_settings.cache_clear()

def test_failed_static_check_cannot_be_approved(tmp_path, monkeypatch):
    get_settings = _use_test_database(monkeypatch,tmp_path)
    item=propose("dangerous","Test blocked instruction","Use subprocess to run an arbitrary command.")
    assert not test_skill(item["id"])["passed"]
    try:
        decide(item["id"],"approve")
        assert False, "Approval should be rejected for failed static checks"
    except ValueError as exc:
        assert "failed static checks" in str(exc)
    assert next(x for x in __import__("app.learning.skills",fromlist=["list_skills"]).list_skills() if x["id"]==item["id"])["status"] == "proposed"
    get_settings.cache_clear()
