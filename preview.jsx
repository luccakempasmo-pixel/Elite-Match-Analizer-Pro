import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const matchWeights = {
  Goleiro: { defesa: 3, golSofrido: -3, passeCerto: 1, passeErrado: -1, assist: 2 },
  Fixo: { desarme: 3, interceptacao: 3, passeCerto: 1, passeErrado: -2, gol: 2 },
  "Ala Esquerda": { gol: 3, assist: 3, desarme: 1, passeErrado: -2, passeCerto: 1 },
  "Ala Direita": { gol: 3, assist: 3, desarme: 1, passeErrado: -2, passeCerto: 1 },
  Pivô: { gol: 4, assist: 2, passeCerto: 1, passeErrado: -1, desarme: 1 }
};

const trainingWeights = {
  Goleiro: { defesa: 2, passeCerto: 2, passeErrado: -1 },
  Fixo: { passeCerto: 2, desarme: 2, passeErrado: -1 },
  "Ala Esquerda": { passeCerto: 2, assist: 2, passeErrado: -1 },
  "Ala Direita": { passeCerto: 2, assist: 2, passeErrado: -1 },
  Pivô: { gol: 3, passeCerto: 1, passeErrado: -1 }
};

const emptyStats = {
  gol: 0,
  assist: 0,
  desarme: 0,
  interceptacao: 0,
  defesa: 0,
  golSofrido: 0,
  passeCerto: 0,
  passeErrado: 0
};

export default function FutsalEliteAnalyzer() {
  const [players, setPlayers] = useState([]);
  const [newPlayer, setNewPlayer] = useState("");
  const [position, setPosition] = useState("Fixo");
  const [mode, setMode] = useState("match");

  // =========================
  // SALVAR NO LOCALSTORAGE
  // =========================
  useEffect(() => {
    const saved = localStorage.getItem("futsalPlayers");
    if (saved) setPlayers(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("futsalPlayers", JSON.stringify(players));
  }, [players]);

  const addPlayer = () => {
    if (!newPlayer) return;

    setPlayers(prev => [
      ...prev,
      {
        id: Date.now(),
        name: newPlayer,
        position,
        matchStats: { ...emptyStats },
        trainingStats: { ...emptyStats }
      }
    ]);

    setNewPlayer("");
  };

  const updateStat = (id, key, delta) => {
    setPlayers(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const statsKey = mode === "match" ? "matchStats" : "trainingStats";
        return {
          ...p,
          [statsKey]: {
            ...p[statsKey],
            [key]: Math.max(0, p[statsKey][key] + delta)
          }
        };
      })
    );
  };

  const calculateScore = (player) => {
    const weights = mode === "match"
      ? matchWeights[player.position]
      : trainingWeights[player.position];

    const stats = mode === "match"
      ? player.matchStats
      : player.trainingStats;

    return Object.keys(stats).reduce((total, key) => {
      return total + (weights[key] ? stats[key] * weights[key] : 0);
    }, 0);
  };

  // =========================
  // RESUMO TOTAL (MATCH + TREINO)
  // =========================
  const totalStats = (player) => {
    const result = {};
    Object.keys(emptyStats).forEach(key => {
      result[key] =
        (player.matchStats[key] || 0) +
        (player.trainingStats[key] || 0);
    });
    return result;
  };

  const ranking = useMemo(() => {
    return [...players]
      .map(p => ({ ...p, score: calculateScore(p) }))
      .sort((a, b) => b.score - a.score);
  }, [players, mode]);

  return (
    <div className="p-4 grid gap-4">
      <Tabs defaultValue="scout">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="scout">Scout</TabsTrigger>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="resumo">Resumo Geral</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório</TabsTrigger>
        </TabsList>

        {/* SCOUT */}
        <TabsContent value="scout">
          <Card className="p-4 rounded-2xl shadow">
            <div className="flex gap-2 mb-4 flex-wrap">
              <Select onValueChange={setMode}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Modo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="match">Jogo</SelectItem>
                  <SelectItem value="training">Treino</SelectItem>
                </SelectContent>
              </Select>

              <Input
                className="w-40"
                placeholder="Nome"
                value={newPlayer}
                onChange={(e) => setNewPlayer(e.target.value)}
              />

              <Select onValueChange={setPosition}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Posição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Goleiro">Goleiro</SelectItem>
                  <SelectItem value="Fixo">Fixo</SelectItem>
                  <SelectItem value="Ala Esquerda">Ala Esquerda</SelectItem>
                  <SelectItem value="Ala Direita">Ala Direita</SelectItem>
                  <SelectItem value="Pivô">Pivô</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={addPlayer}>Adicionar</Button>
            </div>

            {/* GRID COMPACTO */}
            <div className="grid md:grid-cols-2 gap-3">
              {players.map(p => {
                const stats = mode === "match" ? p.matchStats : p.trainingStats;

                return (
                  <Card key={p.id} className="p-3 rounded-xl">
                    <CardContent className="text-sm">
                      <div className="font-bold mb-2">
                        {p.name} ({p.position}) | Nota: {calculateScore(p)}
                      </div>

                      <div className="grid grid-cols-2 gap-1">
                        {Object.keys(stats).map(key => (
                          <div key={key} className="flex justify-between items-center">
                            <span>{key}</span>
                            <div className="flex gap-1">
                              <Button size="sm" onClick={() => updateStat(p.id, key, -1)}>-</Button>
                              <span>{stats[key]}</span>
                              <Button size="sm" onClick={() => updateStat(p.id, key, 1)}>+</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* RESUMO GERAL */}
        <TabsContent value="resumo">
          <Card className="p-4 rounded-2xl shadow">
            {players.map(p => {
              const totals = totalStats(p);
              return (
                <div key={p.id} className="mb-4 border-b pb-2">
                  <strong>{p.name} ({p.position})</strong>
                  <div className="grid grid-cols-4 gap-2 text-sm mt-2">
                    {Object.keys(totals).map(key => (
                      <div key={key}>
                        {key}: {totals[key]}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}