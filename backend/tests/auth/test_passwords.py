from app.auth.passwords import hash_password, verify_password


def test_hash_verifies_only_the_same_password() -> None:
    encoded = hash_password("dogru-sifre")
    assert encoded.startswith("scrypt$")
    assert "dogru-sifre" not in encoded
    assert verify_password("dogru-sifre", encoded)
    assert not verify_password("yanlis-sifre", encoded)


def test_same_password_gets_a_different_salt() -> None:
    assert hash_password("ayni") != hash_password("ayni")


def test_garbage_hash_is_rejected_not_raised() -> None:
    assert not verify_password("x", "not-a-hash")
    assert not verify_password("x", "bcrypt$1$2$3$aa$bb")
