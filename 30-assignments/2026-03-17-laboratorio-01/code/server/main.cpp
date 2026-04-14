/**
 * @file main.cpp
 * @author Gabriel Nicolás González Ferreira
 * @brief Servidor principal para generar ritmos euclidianos
 * @version 0.1
 * @date 2026-03-15
 * @license https://opensource.org/licenses/MIT
 */
 
#include "include/httplib.h"
#include "include/json.hpp" // Librería para JSON
#include <vector>
#include <iostream>

using json = nlohmann::json;

/***
    Función para generar ritmo euclidiano (0 = silencio, 1 = pulso)
    Algoritmo de Bjorklund (Ritmos Euclidianos).
    El ritmo euclidiano distribuye $k$ pulsos en $n$ espacios
    de la forma más equitativa posible.
    Usaremos una versión simplificada del algoritmo para manejar hasta 8 voces.
**/
std::vector<int> generarEuclidiano(int pulsos, int pasos) 
{
    std::vector<int> patron(pasos, 0);
    if (pulsos == 0) return patron;
    float acumulador = 0;
    float ratio = (float)pulsos / pasos;
    for (int i = 0; i < pasos; i++) 
    {
        float nuevoAcumulador = acumulador + ratio;
        if (std::floor(nuevoAcumulador) > std::floor(acumulador))
        {
            patron[i] = 1;
        }
        acumulador = nuevoAcumulador;
    }
    return patron;
}

int main() 
{
    httplib::Server svr;

    // Servir archivos estáticos desde la carpeta /public
    auto ret = svr.set_mount_point("/", "./public");
    if (!ret) 
    {
        std::cerr << "Error: La carpeta ./public no existe." << std::endl;
    }

    // Endpoint de cálculo musical
    svr.Post("/api/generar-patron", [](const httplib::Request& req, httplib::Response& res) 
    {
        try 
        {
            auto j = json::parse(req.body);
            float bpm = j.at("bpm").get<float>();
            auto voces_input = j.at("voces").get<std::vector<int>>(); // Ej: [5, 8, 3...]
            int pasos = 16; // Resolución fija para el algoritmo euclidiano

            float duracion_paso = (60.0f / bpm) / 4.0f; // Un paso es una semicorchea
            json response;

            for (size_t i = 0; i < voces_input.size(); ++i) 
            {
                auto patron = generarEuclidiano(voces_input[i], pasos);
                std::vector<float> offsets;
                for (int p = 0; p < pasos; p++) 
                {
                    if (patron[p] == 1) offsets.push_back(p * duracion_paso);
                }
                response["voz_" + std::to_string(i + 1)] = offsets;
            }
            
            response["duracion_ciclo"] = pasos * duracion_paso;
            res.set_content(response.dump(), "application/json");
        }
        catch (const std::exception& e)
        {
            std::cerr << "Error procesando JSON: " << e.what() << std::endl; // Esto te dirá qué clave falta
            res.status = 400;
            res.set_content("{\"error\": \"JSON inválido o parámetros faltantes\"}", "application/json");
        }
    });

    std::cout << "Servidor iniciado en http://localhost:8080" << std::endl;
    svr.listen("0.0.0.0", 8080);
    return 0;
}