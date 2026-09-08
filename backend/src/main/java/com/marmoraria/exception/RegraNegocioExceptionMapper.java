package com.marmoraria.exception;

import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

import java.util.Map;

@Provider
public class RegraNegocioExceptionMapper implements ExceptionMapper<RegraNegocioException> {

    @Override
    public Response toResponse(RegraNegocioException exception) {
        return Response.status(Response.Status.UNPROCESSABLE_ENTITY)
                .entity(Map.of("erro", exception.getMessage()))
                .type(MediaType.APPLICATION_JSON)
                .build();
    }
}
