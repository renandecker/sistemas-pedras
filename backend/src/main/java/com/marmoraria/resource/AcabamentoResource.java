package com.marmoraria.resource;

import com.marmoraria.entity.Acabamento;
import com.marmoraria.repository.AcabamentoRepository;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.UUID;

@Path("/api/acabamentos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AcabamentoResource {

    @Inject AcabamentoRepository repository;

    @GET
    public List<Acabamento> listar() {
        return repository.listarAtivos();
    }

    @GET
    @Path("/{id}")
    public Acabamento buscar(@PathParam("id") UUID id) {
        return repository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Acabamento não encontrado."));
    }

    @POST
    @Transactional
    public Response criar(@Valid Acabamento acabamento) {
        repository.persist(acabamento);
        return Response.status(Response.Status.CREATED).entity(acabamento).build();
    }
}
