package com.marmoraria.resource;

import com.marmoraria.dto.ItemCalculoRequest;
import com.marmoraria.dto.ItemCalculoResponse;
import com.marmoraria.dto.OrcamentoRequest;
import com.marmoraria.entity.Orcamento;
import com.marmoraria.repository.OrcamentoRepository;
import com.marmoraria.service.OrcamentoService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.UUID;

@Path("/api/orcamentos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class OrcamentoResource {

    @Inject OrcamentoRepository repository;
    @Inject OrcamentoService service;

    @GET
    public List<Orcamento> listar() {
        return repository.listAll();
    }

    @GET
    @Path("/{id}")
    public Orcamento buscar(@PathParam("id") UUID id) {
        return repository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Orçamento não encontrado."));
    }

    /**
     * Endpoint usado pelo formulário do frontend para recalcular em tempo real
     * (área, peso, custo) um item, SEM persistir nada.
     */
    @POST
    @Path("/calcular-item")
    public ItemCalculoResponse calcularItem(@Valid ItemCalculoRequest req) {
        return service.calcularPreview(req);
    }

    @POST
    public Response criar(@Valid OrcamentoRequest req) {
        Orcamento orcamento = service.criar(req);
        return Response.status(Response.Status.CREATED).entity(orcamento).build();
    }

    @PUT
    @Path("/{id}")
    public Orcamento atualizar(@PathParam("id") UUID id, @Valid OrcamentoRequest req) {
        return service.atualizar(id, req);
    }

    @POST
    @Path("/{id}/aprovar")
    public Response aprovar(@PathParam("id") UUID id) {
        service.aprovar(id);
        return Response.noContent().build();
    }
}
