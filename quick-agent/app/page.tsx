"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, Sparkles, Zap, Shield, ArrowRight } from "lucide-react";

export default function HomePage() {
  const [agentName, setAgentName] = useState("");
  const [agentDescription, setAgentDescription] = useState("");

  const handleCreateAgent = async () => {
    // TODO: Implement agent creation
    console.log("Creating agent:", { agentName, agentDescription });
  };

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
        
        <div className="container relative mx-auto px-4 py-20 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/50 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              <span>Powered by Arc Network Testnet</span>
            </div>

            {/* Heading */}
            <h1 className="mb-6 text-5xl font-bold font-poppins leading-tight lg:text-7xl">
              Build{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI Agents
              </span>
              <br />
              On-Chain
            </h1>

            {/* Description */}
            <p className="mb-8 text-lg text-slate-300 lg:text-xl">
              Deploy autonomous AI agents with verifiable identity on Arc
              Network. Simple, fast, and powerful.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="group"
                onClick={() =>
                  document.getElementById("create")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Create Your Agent
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline">
                View Documentation
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mb-2 text-3xl font-bold font-poppins text-indigo-400">
                  0
                </div>
                <div className="text-sm text-slate-400">Agents Created</div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-3xl font-bold font-poppins text-purple-400">
                  ~0.01
                </div>
                <div className="text-sm text-slate-400">USDC Gas Cost</div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-3xl font-bold font-poppins text-pink-400">
                  &lt;1min
                </div>
                <div className="text-sm text-slate-400">Deploy Time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold font-poppins lg:text-4xl">
              Why Build on Arc?
            </h2>
            <p className="text-lg text-slate-400">
              The easiest way to create AI agents with on-chain identity
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="group transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 transition-colors group-hover:bg-indigo-500/20">
                  <Zap className="h-6 w-6" />
                </div>
                <CardTitle>Lightning Fast</CardTitle>
                <CardDescription>
                  Deploy your AI agent in under a minute with our streamlined
                  process
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 transition-colors group-hover:bg-purple-500/20">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle>Secure & Verified</CardTitle>
                <CardDescription>
                  Every agent has a verifiable on-chain identity backed by smart
                  contracts
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-pink-500/10 text-pink-400 transition-colors group-hover:bg-pink-500/20">
                  <Bot className="h-6 w-6" />
                </div>
                <CardTitle>Full Control</CardTitle>
                <CardDescription>
                  Manage, update, and transfer your agent ownership anytime
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Create Agent Section */}
      <section id="create" className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Create Your AI Agent</CardTitle>
                <CardDescription>
                  Deploy a new agent with on-chain identity in just a few clicks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-medium text-slate-200"
                  >
                    Agent Name
                  </label>
                  <Input
                    id="name"
                    placeholder="e.g. Trading Bot Alpha"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="description"
                    className="text-sm font-medium text-slate-200"
                  >
                    Description
                  </label>
                  <Input
                    id="description"
                    placeholder="What does your agent do?"
                    value={agentDescription}
                    onChange={(e) => setAgentDescription(e.target.value)}
                  />
                </div>

                <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-indigo-400 mt-0.5" />
                    <div className="space-y-1 text-sm">
                      <p className="font-medium text-slate-200">
                        Deployment Details
                      </p>
                      <p className="text-slate-400">
                        • Network: Arc Testnet (Chain ID: 5042002)
                      </p>
                      <p className="text-slate-400">
                        • Gas Token: USDC (~0.01 USDC estimated)
                      </p>
                      <p className="text-slate-400">
                        • IPFS Storage: Metadata stored on Pinata
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleCreateAgent}
                  disabled={!agentName || !agentDescription}
                >
                  <Bot className="h-5 w-5" />
                  Deploy Agent
                </Button>

                <p className="text-center text-sm text-slate-400">
                  Make sure you have Arc testnet USDC in your wallet
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-slate-400">
              Built with ❤️ for Arc Network
            </p>
            <div className="flex gap-6">
              <a
                href="https://docs.arc.network"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-400 transition-colors hover:text-slate-200"
              >
                Docs
              </a>
              <a
                href="https://discord.com/invite/buildonarc"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-400 transition-colors hover:text-slate-200"
              >
                Discord
              </a>
              <a
                href="https://github.com/crisphan94/build-on-arc"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-400 transition-colors hover:text-slate-200"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
