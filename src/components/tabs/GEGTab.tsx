"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { Button } from "../ui/buttons/Button";
import { Card } from "../ui/Card";

const socialLinks = [
  {
    name: "Discord",
    url: "https://grueneeule.de/dc",
    icon: "logos:discord-icon",
    color: "bg-[#5865F2] hover:bg-[#4752C4]",
    text: "Discord",
  },
  {
    name: "YouTube",
    url: "https://www.youtube.com/@grueneeule",
    icon: "logos:youtube-icon",
    color: "bg-[#FF0000] hover:bg-[#CC0000]",
    text: "YouTube",
  },
  {
    name: "Twitch",
    url: "http://twitch.tv/grueneeulede",
    icon: "logos:twitch",
    color: "bg-[#9146FF] hover:bg-[#772ce8]",
    text: "Twitch",
  },
];

export default function GEGTab() {
  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6 text-center" variant="flat">
          <h2 className="text-3xl font-bold">Werde Teil der GrüneEule Community!</h2>
          <p className="text-white/70 mt-2 max-w-md mx-auto">
            Vernetze dich mit anderen Spielern, nimm an Events teil und bleib immer auf dem Laufenden.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            {socialLinks.map((social) => (
              <Button
                key={social.name}
                onClick={() => window.open(social.url, "_blank")}
                className={`${social.color} text-white font-semibold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 w-full sm:w-auto`}
                size="lg"
                icon={<Icon icon={social.icon} className="w-6 h-6" />}
              >
                {social.text}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
