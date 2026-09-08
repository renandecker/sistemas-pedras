package com.marmoraria.exception;

/** Exceção lançada quando uma regra de negócio/segurança técnica é violada. */
public class RegraNegocioException extends RuntimeException {
    public RegraNegocioException(String message) {
        super(message);
    }
}
