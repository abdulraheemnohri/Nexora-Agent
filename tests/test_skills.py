from app.learning.skills import propose, test_skill, decide, rollback

def test_skill_lifecycle(tmp_path, monkeypatch):
    from app.config import Settings, get_settings
    monkeypatch.setenv("NEXORA_DATABASE_PATH",str(tmp_path/"test.db"))
    get_settings.cache_clear()
    item=propose("summarizer","Summarize notes","Read the user's notes and produce a concise summary.")
    assert test_skill(item["id"])["passed"]
    assert decide(item["id"],"approve")["status"] == "approved"
    assert rollback(item["id"])["status"] == "rolled_back"
    get_settings.cache_clear()
