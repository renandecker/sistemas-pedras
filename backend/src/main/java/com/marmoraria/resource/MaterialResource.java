package com.marmoraria.resource;

import com.marmoraria.entity.Material;
import com.marmoraria.repository.MaterialRepository;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.UUID;

@Path("/api/materiais")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class MaterialResource {

    @Inject MaterialRepository repository;

    @GET
    public List<Material> listar() {
        return repository.listarAtivos();
    }

    @GET
    @Path("/{id}")
    public Material buscar(@PathParam("id") UUID id) {
        return repository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Material não encontrado."));
    }

    @POST
    @Transactional
    public Response criar(@Valid Material material) {
        repository.persist(material);
        return Response.status(Response.Status.CREATED).entity(material).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Material atualizar(@PathParam("id") UUID id, @Valid Material dados) {
        Material material = repository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Material não encontrado."));
        material.nome = dados.nome;
        material.categoria = dados.categoria;
        material.densidadeKgM3 = dados.densidadeKgM3;
        material.espessuraPadraoM = dados.espessuraPadraoM;
        material.precoM2 = dados.precoM2;
        material.estoqueM2 = dados.estoqueM2;
        material.percentualPerdaPadrao = dados.percentualPerdaPadrao;
        return material;
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response inativar(@PathParam("id") UUID id) {
        Material material = repository.findByIdOptional(id)
                .orElseThrow(() -> new NotFoundException("Material não encontrado."));
        material.ativo = false;
        return Response.noContent().build();
    }
}
