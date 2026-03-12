from ingestion.main import start_ingestion


def test_start_ingestion_assigns_source_code() -> None:
    run = start_ingestion("source-a")
    assert run.source_code == "source-a"
    assert run.run_id.startswith("source-a-")
