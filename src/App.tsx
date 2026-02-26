import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calculator, 
  Languages, 
  Moon, 
  Sun, 
  User, 
  LogOut, 
  Table as TableIcon, 
  Brain, 
  ChevronRight,
  Globe,
  Loader2,
  BookOpen,
  Calendar,
  LineChart as ChartIcon,
  Divide,
  Flag,
  Search,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Box,
  Sigma,
  Hash,
  Quote,
  Book,
  Send,
  Smile,
  MapPin,
  X,
  Mic,
  Pencil,
  History,
  Star,
  Copy,
  Volume2,
  ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { io, Socket } from 'socket.io-client';
import { 
  translations, 
  Language, 
  LANGUAGES, 
  MATH_FORMULAS, 
  SLANG_LIBRARY, 
  UKRAINIAN_GRAMMAR, 
  GERMAN_CASES, 
  IRREGULAR_VERBS 
} from './constants';
import { 
  translateText, 
  generateNMTQuestions,
  generateWriters,
  generateHistoricalFigures,
  generateHistoryDates,
  generateInterestingFact
} from './services/geminiService';

// --- Types ---
interface UserData {
  id: number;
  email: string;
  nickname: string;
  avatar: string;
  country: string;
  lang: string;
  xp: number;
}

interface ChatMessage {
  sender: string;
  text: string;
  lang: string;
  avatar: string;
  translatedText?: string;
}

// --- Data ---
const WRITERS = [
  { name: "Тарас Шевченко", years: "1814–1861", works: "Кобзар, Катерина, Гайдамаки", fact: "Символ українського відродження.", img: "https://picsum.photos/seed/portrait-taras-shevchenko/200/200" },
  { name: "Іван Франко", years: "1856–1916", works: "Захар Беркут, Мойсей", fact: "50+ томів спадщини.", img: "https://picsum.photos/seed/portrait-ivan-franko/200/200" },
  { name: "Леся Українка", years: "1871–1913", works: "Лісова пісня, Contra spem spero", fact: "Знала 10+ мов.", img: "https://picsum.photos/seed/portrait-lesya-ukrainka/200/200" },
  { name: "Михайло Коцюбинський", years: "1864–1913", works: "Тіні забутих предків", fact: "Майстер психологічної прози.", img: "https://picsum.photos/seed/portrait-mykhailo-kotsyubynsky/200/200" },
  { name: "Пантелеймон Куліш", years: "1819–1897", works: "Чорна рада", fact: "Автор першої фонетичної абетки.", img: "https://picsum.photos/seed/portrait-panteleimon-kulish/200/200" },
  { name: "Григорій Сковорода", years: "1722–1794", works: "Сад божественних пісень", fact: "Мандрівний філософ.", img: "https://picsum.photos/seed/portrait-hryhoriy-skovoroda/200/200" },
  { name: "Микола Хвильовий", years: "1893–1933", works: "Я (Романтика)", fact: "Лідер 'Розстріляного відродження'.", img: "https://picsum.photos/seed/portrait-mykola-khvylovy/200/200" },
  { name: "Василь Стус", years: "1938–1985", works: "Палімпсести", fact: "Поет-дисидент, борець за права.", img: "https://picsum.photos/seed/portrait-vasyl-stus/200/200" },
  { name: "Олександр Довженко", years: "1894–1956", works: "Зачарована Десна", fact: "Класик світового кінематографа.", img: "https://picsum.photos/seed/portrait-oleksandr-dovzhenko/200/200" },
  { name: "Ліна Костенко", years: "1930–", works: "Маруся Чурай", fact: "Жива легенда української поезії.", img: "https://picsum.photos/seed/portrait-lina-kostenko/200/200" }
];

const HISTORICAL_FIGURES = [
  { name: "Богдан Хмельницький", years: "1595–1657", fact: "Гетьман, засновник козацької держави.", img: "https://picsum.photos/seed/portrait-bogdan-khmelnytsky/200/200" },
  { name: "Іван Мазепа", years: "1639–1709", fact: "Гетьман, меценат, борець за незалежність.", img: "https://picsum.photos/seed/portrait-ivan-mazepa/200/200" },
  { name: "Михайло Грушевський", years: "1866–1934", fact: "Голова Центральної Ради, історик.", img: "https://picsum.photos/seed/portrait-mykhailo-hrushevsky/200/200" },
  { name: "Ярослав Мудрий", years: "978–1054", fact: "Князь Київський, законодавець.", img: "https://picsum.photos/seed/portrait-yaroslav-mudryi/200/200" },
  { name: "Володимир Великий", years: "958–1015", fact: "Хреститель Русі.", img: "https://picsum.photos/seed/portrait-volodymyr-the-great/200/200" },
  { name: "Степан Бандера", years: "1909–1959", fact: "Лідер ОУН.", img: "https://picsum.photos/seed/portrait-stepan-bandera/200/200" },
  { name: "Костянтин Острозький", years: "1460–1530", fact: "Великий гетьман Литовський.", img: "https://picsum.photos/seed/portrait-kostiantyn-ostrozkyi/200/200" },
  { name: "Данило Галицький", years: "1201–1264", fact: "Король Русі, засновник Львова.", img: "https://picsum.photos/seed/portrait-danylo-halytskyi/200/200" }
];

const HISTORY_DATES = [
  { date: "988", event: "Хрещення Русі", category: "Київська Русь" },
  { date: "1019", event: "Початок правління Ярослава Мудрого", category: "Київська Русь" },
  { date: "1240", event: "Облога Києва монголами", category: "Київська Русь" },
  { date: "1648", event: "Початок Хмельниччини", category: "Козацтво" },
  { date: "1654", event: "Переяславська рада", category: "Козацтво" },
  { date: "1709", event: "Полтавська битва", category: "Козацтво" },
  { date: "1917", event: "Українська революція", category: "УНР" },
  { date: "1918", event: "Бій під Крутами", category: "УНР" },
  { date: "1932-1933", event: "Голодомор", category: "СРСР" },
  { date: "1991", event: "Проголошення Незалежності", category: "Сучасність" },
  { date: "2004", event: "Помаранчева революція", category: "Сучасність" },
  { date: "2014", event: "Революція Гідності", category: "Сучасність" }
];

const COUNTRIES = [
  { name: { en: "Ukraine", uk: "Україна", de: "Ukraine", es: "Ucrania" }, capital: { en: "Kyiv", uk: "Київ", de: "Kiew", es: "Kiev" }, flag: "🇺🇦" },
  { name: { en: "Germany", uk: "Німеччина", de: "Deutschland", es: "Alemania" }, capital: { en: "Berlin", uk: "Берлін", de: "Berlin", es: "Berlín" }, flag: "🇩🇪" },
  { name: { en: "Spain", uk: "Іспанія", de: "Spanien", es: "España" }, capital: { en: "Madrid", uk: "Мадрид", de: "Madrid", es: "Madrid" }, flag: "🇪🇸" },
  { name: { en: "USA", uk: "США", de: "USA", es: "EE. UU." }, capital: { en: "Washington D.C.", uk: "Вашингтон", de: "Washington D.C.", es: "Washington D.C." }, flag: "🇺🇸" },
  { name: { en: "France", uk: "Франція", de: "Frankreich", es: "Francia" }, capital: { en: "Paris", uk: "Париж", de: "Paris", es: "París" }, flag: "🇫🇷" },
  { name: { en: "Japan", uk: "Японія", de: "Japan", es: "Japón" }, capital: { en: "Tokyo", uk: "Токіо", de: "Tokio", es: "Tokio" }, flag: "🇯🇵" },
  { name: { en: "Poland", uk: "Польща", de: "Polen", es: "Polonia" }, capital: { en: "Warsaw", uk: "Варшава", de: "Warschau", es: "Varsovia" }, flag: "🇵🇱" },
  { name: { en: "United Kingdom", uk: "Велика Британія", de: "Großbritannien", es: "Reino Unido" }, capital: { en: "London", uk: "Лондон", de: "London", es: "Londres" }, flag: "🇬🇧" },
  { name: { en: "Italy", uk: "Італія", de: "Italien", es: "Italia" }, capital: { en: "Rome", uk: "Рим", de: "Rom", es: "Roma" }, flag: "🇮🇹" },
  { name: { en: "Canada", uk: "Канада", de: "Kanada", es: "Canadá" }, capital: { en: "Ottawa", uk: "Оттава", de: "Ottawa", es: "Ottawa" }, flag: "🇨🇦" },
  { name: { en: "Brazil", uk: "Бразилія", de: "Brasilien", es: "Brasil" }, capital: { en: "Brasília", uk: "Бразиліа", de: "Brasília", es: "Brasilia" }, flag: "🇧🇷" },
  { name: { en: "Australia", uk: "Австралія", de: "Australien", es: "Australia" }, capital: { en: "Canberra", uk: "Канберра", de: "Canberra", es: "Canberra" }, flag: "🇦🇺" },
  { name: { en: "China", uk: "Китай", de: "China", es: "China" }, capital: { en: "Beijing", uk: "Пекін", de: "Peking", es: "Pekín" }, flag: "🇨🇳" },
  { name: { en: "India", uk: "Індія", de: "Indien", es: "India" }, capital: { en: "New Delhi", uk: "Нью-Делі", de: "Neu-Delhi", es: "Nueva Delhi" }, flag: "🇮🇳" },
  { name: { en: "Mexico", uk: "Мексика", de: "Mexiko", es: "México" }, capital: { en: "Mexico City", uk: "Мехіко", de: "Mexiko-Stadt", es: "Ciudad de México" }, flag: "🇲🇽" },
  { name: { en: "Turkey", uk: "Туреччина", de: "Türkei", es: "Turquía" }, capital: { en: "Ankara", uk: "Анкара", de: "Ankara", es: "Ankara" }, flag: "🇹🇷" },
  { name: { en: "Portugal", uk: "Португалія", de: "Portugal", es: "Portugal" }, capital: { en: "Lisbon", uk: "Лісабон", de: "Lissabon", es: "Lisboa" }, flag: "🇵🇹" },
  { name: { en: "Netherlands", uk: "Нідерланди", de: "Niederlande", es: "Países Bajos" }, capital: { en: "Amsterdam", uk: "Амстердам", de: "Amsterdam", es: "Ámsterdam" }, flag: "🇳🇱" },
  { name: { en: "Sweden", uk: "Швеція", de: "Schweden", es: "Suecia" }, capital: { en: "Stockholm", uk: "Стокгольм", de: "Stockholm", es: "Estocolmo" }, flag: "🇸🇪" },
  { name: { en: "Norway", uk: "Норвегія", de: "Norwegen", es: "Noruega" }, capital: { en: "Oslo", uk: "Осло", de: "Oslo", es: "Oslo" }, flag: "🇳🇴" },
  { name: { en: "Finland", uk: "Фінляндія", de: "Finnland", es: "Finlandia" }, capital: { en: "Helsinki", uk: "Гельсінкі", de: "Helsinki", es: "Helsinki" }, flag: "🇫🇮" },
  { name: { en: "Denmark", uk: "Данія", de: "Dänemark", es: "Dinamarca" }, capital: { en: "Copenhagen", uk: "Копенгаген", de: "Kopenhagen", es: "Copenhague" }, flag: "🇩🇰" },
  { name: { en: "Switzerland", uk: "Швейцарія", de: "Schweiz", es: "Suiza" }, capital: { en: "Bern", uk: "Берн", de: "Bern", es: "Berna" }, flag: "🇨🇭" },
  { name: { en: "Austria", uk: "Австрія", de: "Österreich", es: "Austria" }, capital: { en: "Vienna", uk: "Відень", de: "Wien", es: "Viena" }, flag: "🇦🇹" },
  { name: { en: "Belgium", uk: "Бельгія", de: "Belgien", es: "Bélgica" }, capital: { en: "Brussels", uk: "Брюссель", de: "Brüssel", es: "Bruselas" }, flag: "🇧🇪" },
  { name: { en: "Greece", uk: "Греція", de: "Griechenland", es: "Grecia" }, capital: { en: "Athens", uk: "Афіни", de: "Athen", es: "Atenas" }, flag: "🇬🇷" },
  { name: { en: "Czech Republic", uk: "Чехія", de: "Tschechien", es: "República Checa" }, capital: { en: "Prague", uk: "Прага", de: "Prag", es: "Praga" }, flag: "🇨🇿" },
  { name: { en: "Hungary", uk: "Угорщина", de: "Ungarn", es: "Hungría" }, capital: { en: "Budapest", uk: "Будапешт", de: "Budapest", es: "Budapest" }, flag: "🇭🇺" },
  { name: { en: "Romania", uk: "Румунія", de: "Rumänien", es: "Rumania" }, capital: { en: "Bucharest", uk: "Бухарест", de: "Bukarest", es: "Bucarest" }, flag: "🇷🇴" },
  { name: { en: "Bulgaria", uk: "Болгарія", de: "Bulgarien", es: "Bulgaria" }, capital: { en: "Sofia", uk: "Софія", de: "Sofia", es: "Sofía" }, flag: "🇧🇬" },
  { name: { en: "Croatia", uk: "Хорватія", de: "Kroatien", es: "Croacia" }, capital: { en: "Zagreb", uk: "Загреб", de: "Zagreb", es: "Zagreb" }, flag: "🇭🇷" },
  { name: { en: "Slovakia", uk: "Словаччина", de: "Slowakei", es: "Eslovaquia" }, capital: { en: "Bratislava", uk: "Братислава", de: "Bratislava", es: "Bratislava" }, flag: "🇸🇰" },
  { name: { en: "Slovenia", uk: "Словенія", de: "Slowenien", es: "Eslovenia" }, capital: { en: "Ljubljana", uk: "Любляна", de: "Ljubljana", es: "Liubliana" }, flag: "🇸🇮" },
  { name: { en: "Estonia", uk: "Естонія", de: "Estland", es: "Estonia" }, capital: { en: "Tallinn", uk: "Таллінн", de: "Tallinn", es: "Tallinn" }, flag: "🇪🇪" },
  { name: { en: "Latvia", uk: "Латвія", de: "Lettland", es: "Letonia" }, capital: { en: "Riga", uk: "Рига", de: "Riga", es: "Riga" }, flag: "🇱🇻" },
  { name: { en: "Lithuania", uk: "Литва", de: "Litauen", es: "Lituania" }, capital: { en: "Vilnius", uk: "Вільнюс", de: "Vilnius", es: "Vilna" }, flag: "🇱🇹" },
  { name: { en: "Ireland", uk: "Ірландія", de: "Irland", es: "Irlanda" }, capital: { en: "Dublin", uk: "Дублін", de: "Dublin", es: "Dublín" }, flag: "🇮🇪" },
  { name: { en: "Iceland", uk: "Ісландія", de: "Island", es: "Islandia" }, capital: { en: "Reykjavik", uk: "Рейк'явік", de: "Reykjavik", es: "Reikiavik" }, flag: "🇮🇸" },
];

const NMT_QUESTIONS = [
  { q: "Скільки відмінків в українській мові?", a: ["6", "7", "8"], c: 1 },
  { q: "Хто автор 'Чорної ради'?", a: ["Т. Шевченко", "І. Франко", "П. Куліш"], c: 2 },
  { q: "Коли відбулося Хрещення Русі?", a: ["988", "1054", "1240"], c: 0 },
  { q: "Choose correct: She ___ a student.", a: ["is", "are", "am"], c: 0 }
];

// --- Components ---

const TrigTable = ({ lang }: { lang: Language }) => {
  const t = translations[lang];
  const angles = [
    { d: 0, r: "0", s: "0", c: "1", t: "0", ct: "—" },
    { d: 30, r: "π/6", s: "1/2", c: "√3/2", t: "√3/3", ct: "√3" },
    { d: 45, r: "π/4", s: "√2/2", c: "√2/2", t: "1", ct: "1" },
    { d: 60, r: "π/3", s: "√3/2", c: "1/2", t: "√3", ct: "√3/3" },
    { d: 90, r: "π/2", s: "1", c: "0", t: "—", ct: "0" },
    { d: 180, r: "π", s: "0", c: "-1", t: "0", ct: "—" },
    { d: 270, r: "3π/2", s: "-1", c: "0", t: "—", ct: "0" },
    { d: 360, r: "2π", s: "0", c: "1", t: "0", ct: "—" }
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full text-xs text-left">
        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          <tr>
            <th className="px-3 py-2">{t.degree}°</th>
            <th className="px-3 py-2">{t.rad}</th>
            <th className="px-3 py-2">{t.sin}</th>
            <th className="px-3 py-2">{t.cos}</th>
            <th className="px-3 py-2">{t.tan}</th>
            <th className="px-3 py-2">{t.cot}</th>
          </tr>
        </thead>
        <tbody>
          {angles.map((a) => (
            <tr key={a.d} className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="px-3 py-2 font-medium">{a.d}°</td>
              <td className="px-3 py-2 text-slate-500">{a.r}</td>
              <td className="px-3 py-2">{a.s}</td>
              <td className="px-3 py-2">{a.c}</td>
              <td className="px-3 py-2">{a.t}</td>
              <td className="px-3 py-2">{a.ct}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SquaresCubesTable = () => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          <tr>
            <th className="px-4 py-2">n</th>
            <th className="px-4 py-2">n²</th>
            <th className="px-4 py-2">n³</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
            <tr key={n} className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="px-4 py-2 font-medium">{n}</td>
              <td className="px-4 py-2">{n * n}</td>
              <td className="px-4 py-2">{n * n * n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ChatComponent = ({ user, appLang }: { user: UserData, appLang: string }) => {
  const t = translations[appLang] || translations.en;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socketRef.current = io();
    socketRef.current.on('message', async (msg: ChatMessage) => {
      if (msg.lang !== appLang) {
        const translated = await translateText(msg.text, appLang);
        msg.translatedText = translated;
      }
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [appLang]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const msg: ChatMessage = {
      sender: user.nickname,
      text: input,
      lang: appLang,
      avatar: user.avatar
    };
    socketRef.current?.emit('message', msg);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[400px] bg-slate-100 dark:bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex items-start gap-2 ${m.sender === user.nickname ? 'flex-row-reverse' : ''}`}>
            <div className="text-2xl">{m.avatar}</div>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.sender === user.nickname ? 'bg-blue-500 text-white' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white'}`}>
              <p className="text-[10px] opacity-50 mb-1">{m.sender}</p>
              <p>{m.translatedText || m.text}</p>
              {m.translatedText && <p className="text-[10px] italic opacity-50 mt-1">(translated from {m.lang})</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex gap-2">
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder={t.typeMessage}
          className="flex-1 bg-slate-100 dark:bg-slate-900 p-2 rounded-xl outline-none text-sm"
        />
        <button onClick={handleSend} className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

const GeometryCalculator = ({ lang }: { lang: string }) => {
  const t = translations[lang] || translations.en;
  const [shape, setShape] = useState<'cube' | 'sphere' | 'circle' | 'rectangle' | 'cylinder' | 'cone' | 'pyramid'>('cube');
  const [vals, setVals] = useState({ a: 0, b: 0, r: 0, h: 0 });
  const [res, setRes] = useState<{ v?: number, a?: number, p?: number }>({});

  const calculate = () => {
    const { a, b, r, h } = vals;
    if (shape === 'cube') {
      setRes({ v: Math.pow(a, 3), a: 6 * Math.pow(a, 2), p: 12 * a });
    } else if (shape === 'sphere') {
      setRes({ v: (4/3) * Math.PI * Math.pow(r, 3), a: 4 * Math.PI * Math.pow(r, 2) });
    } else if (shape === 'circle') {
      setRes({ a: Math.PI * Math.pow(r, 2), p: 2 * Math.PI * r });
    } else if (shape === 'rectangle') {
      setRes({ a: a * b, p: 2 * (a + b) });
    } else if (shape === 'cylinder') {
      setRes({ v: Math.PI * r * r * h, a: 2 * Math.PI * r * (r + h) });
    } else if (shape === 'cone') {
      setRes({ v: (1/3) * Math.PI * r * r * h, a: Math.PI * r * (r + Math.sqrt(r*r + h*h)) });
    } else if (shape === 'pyramid') {
      setRes({ v: (1/3) * a * b * h });
    }
  };

  return (
    <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700">
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {['cube', 'sphere', 'circle', 'rectangle', 'cylinder', 'cone', 'pyramid'].map(s => (
          <button key={s} onClick={() => setShape(s as any)} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${shape === s ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'}`}>
            {s}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(shape === 'cube' || shape === 'rectangle' || shape === 'pyramid') && (
          <input type="number" placeholder={t.side || 'Side/Length'} onChange={e => setVals({...vals, a: +e.target.value})} className="p-2 bg-white dark:bg-slate-900 rounded-xl text-sm border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500" />
        )}
        {(shape === 'rectangle' || shape === 'pyramid') && (
          <input type="number" placeholder={t.width || 'Width'} onChange={e => setVals({...vals, b: +e.target.value})} className="p-2 bg-white dark:bg-slate-900 rounded-xl text-sm border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500" />
        )}
        {(shape === 'sphere' || shape === 'circle' || shape === 'cylinder' || shape === 'cone') && (
          <input type="number" placeholder={t.radius || 'Radius'} onChange={e => setVals({...vals, r: +e.target.value})} className="p-2 bg-white dark:bg-slate-900 rounded-xl text-sm border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500" />
        )}
        {(shape === 'cylinder' || shape === 'cone' || shape === 'pyramid') && (
          <input type="number" placeholder={t.height || 'Height'} onChange={e => setVals({...vals, h: +e.target.value})} className="p-2 bg-white dark:bg-slate-900 rounded-xl text-sm border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500" />
        )}
      </div>
      <button onClick={calculate} className="w-full py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all active:scale-95">{t.solve}</button>
      <div className="space-y-1 text-[10px] font-mono font-bold uppercase">
        {res.v !== undefined && <p className="text-emerald-500">{t.volume}: {res.v.toFixed(2)}</p>}
        {res.a !== undefined && <p className="text-blue-500">{t.area}: {res.a.toFixed(2)}</p>}
        {res.p !== undefined && <p className="text-amber-500">{t.perimeter}: {res.p.toFixed(2)}</p>}
      </div>
    </div>
  );
};

const FractionCalculator = ({ lang }: { lang: string }) => {
  const t = translations[lang] || translations.en;
  const [f1, setF1] = useState({ n: 1, d: 2 });
  const [f2, setF2] = useState({ n: 1, d: 3 });
  const [op, setOp] = useState('+');
  const [res, setRes] = useState<string | null>(null);

  const solve = () => {
    let rn, rd;
    if (op === '+') { rn = f1.n * f2.d + f2.n * f1.d; rd = f1.d * f2.d; }
    else if (op === '-') { rn = f1.n * f2.d - f2.n * f1.d; rd = f1.d * f2.d; }
    else if (op === '*') { rn = f1.n * f2.n; rd = f1.d * f2.d; }
    else { rn = f1.n * f2.d; rd = f1.d * f2.n; }
    
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const common = Math.abs(gcd(rn, rd));
    setRes(`${rn/common}/${rd/common}`);
  };

  return (
    <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 justify-center">
        <div className="flex flex-col gap-1 w-12">
          <input type="number" value={f1.n} onChange={e => setF1({...f1, n: +e.target.value})} className="p-1 text-center bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-xs" />
          <div className="h-px bg-slate-400" />
          <input type="number" value={f1.d} onChange={e => setF1({...f1, d: +e.target.value})} className="p-1 text-center bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-xs" />
        </div>
        <select value={op} onChange={e => setOp(e.target.value)} className="bg-transparent font-bold text-blue-500">
          {['+', '-', '*', '/'].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <div className="flex flex-col gap-1 w-12">
          <input type="number" value={f2.n} onChange={e => setF2({...f2, n: +e.target.value})} className="p-1 text-center bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-xs" />
          <div className="h-px bg-slate-400" />
          <input type="number" value={f2.d} onChange={e => setF2({...f2, d: +e.target.value})} className="p-1 text-center bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-xs" />
        </div>
        <button onClick={solve} className="p-2 bg-blue-500 text-white rounded-lg"><ChevronRight size={16}/></button>
      </div>
      {res && <p className="text-center font-mono font-bold text-emerald-500">{t.result}: {res}</p>}
    </div>
  );
};

const GraphPlotter = ({ lang }: { lang: string }) => {
  const t = translations[lang] || translations.en;
  const [func, setFunc] = useState('x * x');
  const [data, setData] = useState<any[]>([]);

  const plot = () => {
    const newData = [];
    for (let x = -10; x <= 10; x += 0.5) {
      try {
        const y = eval(func.replace(/x/g, `(${x})`));
        newData.push({ x, y });
      } catch (e) { console.error(e); }
    }
    setData(newData);
  };

  return (
    <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700">
      <div className="flex gap-2">
        <input value={func} onChange={e => setFunc(e.target.value)} placeholder={t.func} className="flex-1 p-2 bg-white dark:bg-slate-900 rounded-xl text-xs border border-slate-200 dark:border-slate-700" />
        <button onClick={plot} className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-xs font-bold">{t.plot}</button>
      </div>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="x" hide />
            <YAxis hide />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
            <Line type="monotone" dataKey="y" stroke="#6366f1" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const DiscriminantCalculator = ({ lang }: { lang: string }) => {
  const t = translations[lang] || translations.en;
  const [a, setA] = useState(1);
  const [b, setB] = useState(-5);
  const [c, setC] = useState(6);
  const [res, setRes] = useState<{ d: number, x1?: number, x2?: number } | null>(null);

  const solve = () => {
    const d = b * b - 4 * a * c;
    if (d < 0) setRes({ d });
    else if (d === 0) setRes({ d, x1: -b / (2 * a) });
    else setRes({ d, x1: (-b + Math.sqrt(d)) / (2 * a), x2: (-b - Math.sqrt(d)) / (2 * a) });
  };

  return (
    <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700">
      <div className="flex gap-2 items-center text-xs font-mono">
        <input type="number" value={a} onChange={e => setA(+e.target.value)} className="w-10 p-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700" />
        <span>x² +</span>
        <input type="number" value={b} onChange={e => setB(+e.target.value)} className="w-10 p-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700" />
        <span>x +</span>
        <input type="number" value={c} onChange={e => setC(+e.target.value)} className="w-10 p-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700" />
        <span>= 0</span>
        <button onClick={solve} className="p-2 bg-blue-500 text-white rounded-lg"><ChevronRight size={16}/></button>
      </div>
      {res && (
        <div className="text-[10px] font-mono font-bold space-y-1">
          <p className="text-blue-500">D = {res.d}</p>
          {res.x1 !== undefined && <p className="text-emerald-500">x1 = {res.x1.toFixed(2)}</p>}
          {res.x2 !== undefined && <p className="text-emerald-500">x2 = {res.x2.toFixed(2)}</p>}
          {res.d < 0 && <p className="text-rose-500">No real roots</p>}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [lang, setLang] = useState<Language>('uk');
  const [isDark, setIsDark] = useState(true);
  const [selectedFigure, setSelectedFigure] = useState<any>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [figureDetail, setFigureDetail] = useState('');
  const [transHistory, setTransHistory] = useState<{source: string, target: string, result: string}[]>([]);
  const [savedTrans, setSavedTrans] = useState<{source: string, target: string, result: string}[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [sourceLang, setSourceLang] = useState('Detect Language');

  const handleFigureClick = async (figure: any) => {
    setSelectedFigure(figure);
    setIsDetailLoading(true);
    setFigureDetail('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Provide a detailed Wikipedia-style biography for ${figure.name}. Include early life, major achievements, and legacy. Language: ${lang === 'uk' ? 'Ukrainian' : 'English'}.`,
      });
      setFigureDetail(response.text || '');
    } catch (err) {
      console.error(err);
      setFigureDetail('Failed to load details from Wikipedia.');
    } finally {
      setIsDetailLoading(false);
    }
  };
  const [user, setUser] = useState<UserData | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('👤');
  const [country, setCountry] = useState('Ukraine');
  const [calcInput, setCalcInput] = useState('');
  const [transText, setTransText] = useState('');
  const [targetLang, setTargetLang] = useState('English');
  const [transResult, setTransResult] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [dynamicQuestions, setDynamicQuestions] = useState<any[]>([]);
  const [dynamicWriters, setDynamicWriters] = useState<any[]>([]);
  const [dynamicFigures, setDynamicFigures] = useState<any[]>([]);
  const [dynamicDates, setDynamicDates] = useState<any[]>([]);
  const [hourlyFact, setHourlyFact] = useState<string>("");
  const [dailyQuote, setDailyQuote] = useState<string>("");
  const [bibleVerse, setBibleVerse] = useState<string>("");
  const [isRefreshingWriters, setIsRefreshingWriters] = useState(false);
  const [isRefreshingFigures, setIsRefreshingFigures] = useState(false);
  const [isRefreshingDates, setIsRefreshingDates] = useState(false);
  const [isRefreshingFormulas, setIsRefreshingFormulas] = useState(false);
  const [isRefreshingGrammar, setIsRefreshingGrammar] = useState(false);
  const [dynamicFormulas, setDynamicFormulas] = useState<any[]>([]);
  const [dynamicGrammar, setDynamicGrammar] = useState<any[]>([]);
  const [dynamicTranslations, setDynamicTranslations] = useState<any>(null);
  const [isLoadingLang, setIsLoadingLang] = useState(false);
  
  const t = useMemo(() => {
    if (dynamicTranslations) return dynamicTranslations;
    return translations[lang] || translations.en;
  }, [lang, dynamicTranslations]);

  useEffect(() => {
    const loadDynamicTranslations = async () => {
      if (lang !== 'en' && lang !== 'uk') {
        setIsLoadingLang(true);
        try {
          const prompt = `Translate the following UI labels into ${LANGUAGES[lang].name}. Return ONLY a JSON object with the same keys: ${JSON.stringify(translations.en)}`;
          const result = await translateText(prompt, lang);
          const parsed = JSON.parse(result.substring(result.indexOf('{'), result.lastIndexOf('}') + 1));
          setDynamicTranslations(parsed);
        } catch (e) {
          console.error("Failed to translate UI", e);
          setDynamicTranslations(null);
        } finally {
          setIsLoadingLang(false);
        }
      } else {
        setDynamicTranslations(null);
      }
    };
    loadDynamicTranslations();
  }, [lang]);

  useEffect(() => {
    const fetchDaily = async () => {
      const quote = await translateText("Generate an inspiring quote for teens.", lang);
      const verse = await translateText("Generate a comforting Bible verse.", lang);
      setDailyQuote(quote);
      setBibleVerse(verse);
    };
    fetchDaily();
  }, [lang]);
  
  // New States
  const [quizAnswers, setQuizAnswers] = useState<number[]>(new Array(NMT_QUESTIONS.length).fill(-1));
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [graphFunc, setGraphFunc] = useState('Math.sin(x)');
  const [countrySearch, setCountrySearch] = useState('');
  const [fracA, setFracA] = useState({ n: 1, d: 2 });
  const [fracB, setFracB] = useState({ n: 1, d: 3 });
  const [fracOp, setFracOp] = useState('+');
  const [fracRes, setFracRes] = useState<string | null>(null);
  const [graphPreset, setGraphPreset] = useState('Math.sin(x)');
  const [discA, setDiscA] = useState(1);
  const [discB, setDiscB] = useState(-5);
  const [discC, setDiscC] = useState(6);
  const [discRes, setDiscRes] = useState<{ d: number, x1: number | null, x2: number | null } | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    const interval = setInterval(() => {
      handleGenerateTest();
    }, 15 * 60 * 1000); // 15 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchFact = async () => {
      const fact = await generateInterestingFact(lang);
      setHourlyFact(fact);
    };
    fetchFact();
    const factInterval = setInterval(fetchFact, 60 * 60 * 1000); // 60 minutes
    return () => clearInterval(factInterval);
  }, [lang]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = authMode === 'login' 
      ? { email, password } 
      : { email, password, nickname, avatar, country, lang };
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user || { id: data.userId, email, xp: 0, nickname, avatar, country, lang });
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Auth failed');
    }
  };

  const handleTranslate = async () => {
    if (!transText.trim()) return;
    setIsTranslating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Translate the following text to ${targetLang}. Only return the translation. Text: ${transText}`,
      });
      const result = response.text || '';
      setTransResult(result);
      setTransHistory(prev => [{source: transText, target: targetLang, result}, ...prev].slice(0, 10));
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleGenerateTest = async () => {
    setIsGeneratingTest(true);
    const questions = await generateNMTQuestions();
    if (questions.length > 0) {
      setDynamicQuestions(questions);
      setQuizAnswers(new Array(questions.length).fill(-1));
      setQuizScore(null);
    }
    setIsGeneratingTest(false);
  };

  const handleRefreshWriters = async () => {
    setIsRefreshingWriters(true);
    const writers = await generateWriters(lang);
    if (writers.length > 0) setDynamicWriters(writers);
    setIsRefreshingWriters(false);
  };

  const handleRefreshFigures = async () => {
    setIsRefreshingFigures(true);
    const figures = await generateHistoricalFigures(lang);
    if (figures.length > 0) setDynamicFigures(figures);
    setIsRefreshingFigures(false);
  };

  const handleRefreshDates = async () => {
    setIsRefreshingDates(true);
    const dates = await generateHistoryDates(lang);
    if (dates.length > 0) setDynamicDates(dates);
    setIsRefreshingDates(false);
  };

  const handleRefreshFormulas = async () => {
    setIsRefreshingFormulas(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate 10 advanced math or physics formulas with categories. Return JSON array: [{category: string, name: string, formula: string}]`,
      });
      const text = response.text || '[]';
      const parsed = JSON.parse(text.substring(text.indexOf('['), text.lastIndexOf(']') + 1));
      setDynamicFormulas(parsed);
    } catch (e) { console.error(e); }
    finally { setIsRefreshingFormulas(false); }
  };

  const handleRefreshGrammar = async () => {
    setIsRefreshingGrammar(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate 5 important Ukrainian grammar rules. Return JSON array: [{title: string, rule: string}]`,
      });
      const text = response.text || '[]';
      const parsed = JSON.parse(text.substring(text.indexOf('['), text.lastIndexOf(']') + 1));
      setDynamicGrammar(parsed);
    } catch (e) { console.error(e); }
    finally { setIsRefreshingGrammar(false); }
  };

  const calculate = () => {
    try {
      const sanitized = calcInput.replace(/[^-+*/().0-9Math.sincoqrtanlpgPIE]/gi, '');
      const result = eval(sanitized);
      setCalcInput(result.toString());
    } catch {
      setCalcInput('Error');
    }
  };

  const solveFraction = () => {
    const { n: n1, d: d1 } = fracA;
    const { n: n2, d: d2 } = fracB;
    let rn, rd;
    if (fracOp === '+') { rn = n1 * d2 + n2 * d1; rd = d1 * d2; }
    else if (fracOp === '-') { rn = n1 * d2 - n2 * d1; rd = d1 * d2; }
    else if (fracOp === '*') { rn = n1 * n2; rd = d1 * d2; }
    else { rn = n1 * d2; rd = d1 * n2; }
    
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const common = Math.abs(gcd(rn, rd));
    setFracRes(`${rn / common} / ${rd / common}`);
  };

  const solveDiscriminant = () => {
    const d = discB * discB - 4 * discA * discC;
    if (d < 0) {
      setDiscRes({ d, x1: null, x2: null });
    } else if (d === 0) {
      setDiscRes({ d, x1: -discB / (2 * discA), x2: null });
    } else {
      setDiscRes({ d, x1: (-discB + Math.sqrt(d)) / (2 * discA), x2: (-discB - Math.sqrt(d)) / (2 * discA) });
    }
  };

  const graphData = useMemo(() => {
    const data = [];
    for (let x = -10; x <= 10; x += 0.5) {
      try {
        const y = eval(graphFunc.replace(/x/g, `(${x})`));
        data.push({ x, y });
      } catch {
        data.push({ x, y: null });
      }
    }
    return data;
  }, [graphFunc]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass w-full max-w-md p-8 rounded-3xl"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-orange-400 to-emerald-500 rounded-2xl text-white shadow-lg shadow-orange-500/20">
              <Brain size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">{t.title}</h1>
          <p className="text-slate-500 text-center mb-8">{authMode === 'login' ? t.welcome : t.register}</p>
          
          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'register' && (
              <div className="space-y-4 mb-4">
                <div className="flex justify-center gap-2 flex-wrap">
                  {['👤', '🐱', '🐶', '🦊', '🦁', '🤖', '👾', '👻'].map(a => (
                    <button 
                      key={a} 
                      type="button"
                      onClick={() => setAvatar(a)} 
                      className={`text-2xl p-2 rounded-xl border-2 transition-all ${avatar === a ? 'border-blue-500 bg-blue-500/10' : 'border-transparent bg-slate-100 dark:bg-slate-800'}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder={t.nickname}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  required
                />
                <select 
                  value={country} 
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.name.en} value={c.name.en}>{c.flag} {c.name[lang as any] || c.name.en}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">{t.email}</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="user@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.password}</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95"
            >
              {authMode === 'login' ? t.login : t.register}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-blue-500 hover:underline text-sm font-medium"
            >
              {authMode === 'login' ? t.noAccount : t.hasAccount}
            </button>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            {(['en', 'uk', 'de', 'es'] as Language[]).map((l) => (
              <button 
                key={l} 
                onClick={() => setLang(l)}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${lang === l ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-slate-200 dark:border-slate-800 px-4 py-4 mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-400 to-emerald-500 rounded-lg text-white">
              <Brain size={20} />
            </div>
            <h1 className="font-bold hidden sm:flex items-center gap-2">
              {t.title}
              <span className="text-lg">{LANGUAGES[lang]?.flag}</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-4 mr-4 px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold">
              <span className="text-slate-500 uppercase">{t.level} {Math.floor(user.xp / 50) + 1}</span>
              <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${(user.xp % 50) * 2}%` }}
                />
              </div>
              <span className="text-blue-500">{user.xp} {t.xp}</span>
            </div>

            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="relative group">
              <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                <Globe size={20} />
                <span className="text-xs font-bold uppercase">{lang}</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 max-h-64 overflow-y-auto glass rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100]">
                {Object.entries(LANGUAGES).map(([code, info]) => (
                  <button 
                    key={code} 
                    onClick={() => setLang(code as any)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-500 hover:text-white transition-colors flex items-center gap-2 font-bold ${lang === code ? 'bg-blue-500/10 text-blue-500' : ''}`}
                  >
                    <span>{info.flag}</span>
                    <span>{info.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setUser(null)}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 space-y-8">
        {/* Daily Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500"><Quote size={20} /></div>
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-xs">{t.dailyQuote}</h3>
            </div>
            <p className="text-sm italic text-slate-600 dark:text-slate-400 leading-relaxed">"{dailyQuote || 'Loading...'}"</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass p-6 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500"><Book size={20} /></div>
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-xs">{t.bibleVerse}</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{bibleVerse || 'Loading...'}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass p-6 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500"><Smile size={20} /></div>
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-xs">{t.slang}</h3>
            </div>
            <div className="space-y-2">
              {SLANG_LIBRARY.slice(0, 3).map((s, i) => (
                <div key={i} className="text-xs">
                  <span className="font-bold text-emerald-500">{s.word}:</span> <span className="text-slate-600 dark:text-slate-400">{s.meaning}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Column 1 */}
          <div className="lg:col-span-4 space-y-8">
            <section className="glass p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500"><MessageSquare size={20} /></div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t.chat}</h3>
              </div>
              <ChatComponent user={user} appLang={lang} />
            </section>

            <section className="glass p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500"><Box size={20} /></div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t.geometry}</h3>
              </div>
              <GeometryCalculator lang={lang} />
            </section>

            <section className="glass p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500"><Divide size={20} /></div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t.fractionCalc}</h3>
              </div>
              <FractionCalculator lang={lang} />
            </section>

            <section className="glass p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500"><ChartIcon size={20} /></div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t.graphPlotter}</h3>
              </div>
              <GraphPlotter lang={lang} />
            </section>

            <section className="glass p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500"><Hash size={20} /></div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t.discriminantCalc}</h3>
              </div>
              <DiscriminantCalculator lang={lang} />
            </section>

            <section className="glass p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500"><Sigma size={20} /></div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t.formulas}</h3>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2">
                {MATH_FORMULAS.map((f, i) => (
                  <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{f.name}</p>
                    <p className="text-sm font-mono font-bold text-indigo-500">{f.formula}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Column 2 */}
          <div className="lg:col-span-4 space-y-8">
            <section className="glass p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                  <Calculator size={20} />
                </div>
                <h2 className="font-bold">{t.calculator}</h2>
              </div>
              <div className="mb-4">
                <input 
                  type="text" 
                  value={calcInput}
                  onChange={(e) => setCalcInput(e.target.value)}
                  className="w-full text-right text-2xl font-mono p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['sin(', 'cos(', 'tan(', 'sqrt(', 'log10(', 'log(', '(', ')', '**', '**(1/', 'Math.PI', 'Math.E'].map(fn => (
                  <button key={fn} onClick={() => {
                    if (fn === '**') setCalcInput(prev => prev + '**');
                    else if (fn === '**(1/') setCalcInput(prev => prev + '**(1/');
                    else if (fn.startsWith('Math.')) setCalcInput(prev => prev + fn);
                    else setCalcInput(prev => prev + 'Math.' + fn);
                  }} className="p-2 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-purple-500 hover:text-white transition-all">
                    {fn === '**' ? 'xʸ' : fn === '**(1/' ? 'ʸ√x' : fn.replace('Math.', '').replace('(', '')}
                  </button>
                ))}
                {[7, 8, 9, '/', 4, 5, 6, '*', 1, 2, 3, '-', 0, '.', 'C', '+'].map(val => (
                  <button key={val} onClick={() => val === 'C' ? setCalcInput('') : setCalcInput(prev => prev + val)} className={`p-3 font-bold rounded-xl transition-all ${typeof val === 'number' ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700' : 'bg-slate-200 dark:bg-slate-700 text-purple-500 hover:bg-purple-500 hover:text-white'}`}>
                    {val === '*' ? '×' : val === '/' ? '÷' : val}
                  </button>
                ))}
                <button onClick={calculate} className="col-span-4 p-4 bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 hover:bg-purple-600 transition-all active:scale-95 mt-2">=</button>
              </div>
            </section>

            <section className="glass p-6 rounded-3xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
                    <Brain size={20} />
                  </div>
                  <h2 className="font-bold">{t.nmtTest}</h2>
                </div>
                <button onClick={handleGenerateTest} disabled={isGeneratingTest} className="p-2 bg-orange-500 text-white rounded-lg disabled:opacity-50">
                  {isGeneratingTest ? <Loader2 className="animate-spin" size={16} /> : <ChevronRight size={16} />}
                </button>
              </div>
              <div className="space-y-6">
                {(dynamicQuestions.length > 0 ? dynamicQuestions : NMT_QUESTIONS).map((q, i) => (
                  <div key={i} className="space-y-2">
                    <p className="text-sm font-medium">{i + 1}. {q.q}</p>
                    <div className="grid grid-cols-1 gap-2">
                      {q.a.map((ans, j) => (
                        <button key={j} onClick={() => {
                          const newAns = [...quizAnswers];
                          newAns[i] = j;
                          setQuizAnswers(newAns);
                        }} className={`p-2 text-left text-xs rounded-lg transition-all ${quizAnswers[i] === j ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'}`}>
                          {ans}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={() => {
                  let score = 0;
                  const currentQuestions = dynamicQuestions.length > 0 ? dynamicQuestions : NMT_QUESTIONS;
                  currentQuestions.forEach((q, i) => { if (quizAnswers[i] === q.c) score++; });
                  setQuizScore(score);
                }} className="w-full p-3 bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30">{t.checkResult}</button>
                {quizScore !== null && <div className="text-center font-bold text-orange-500">{t.result}: {quizScore} / {(dynamicQuestions.length > 0 ? dynamicQuestions : NMT_QUESTIONS).length}</div>}
              </div>
            </section>

            <section className="glass p-6 rounded-3xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
                    <BookOpen size={20} />
                  </div>
                  <h2 className="font-bold">{t.writers}</h2>
                </div>
                <button onClick={handleRefreshWriters} disabled={isRefreshingWriters} className="p-2 bg-rose-500 text-white rounded-lg disabled:opacity-50">
                  {isRefreshingWriters ? <Loader2 className="animate-spin" size={16} /> : <ChevronRight size={16} />}
                </button>
              </div>
              <div className="space-y-4">
                {(dynamicWriters.length > 0 ? dynamicWriters : WRITERS).map((w, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleFigureClick(w)}
                    className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl flex gap-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                  >
                    <img src={w.img} alt={w.name} className="w-16 h-16 rounded-xl object-cover shadow-md" referrerPolicy="no-referrer" />
                    <div>
                      <h3 className="font-bold text-sm">{w.name} <span className="text-xs font-normal opacity-50">({w.years})</span></h3>
                      <p className="text-xs mt-1 opacity-70"><b>{t.works}:</b> {w.works}</p>
                      <p className="text-xs mt-1 italic text-rose-500">{w.fact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Column 3 */}
          <div className="lg:col-span-4 space-y-8">
            <section className="glass p-6 rounded-3xl overflow-hidden">
              <div className="flex items-center gap-3 mb-6 px-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                  <Languages size={20} />
                </div>
                <h2 className="font-bold">{t.translator}</h2>
              </div>
              
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                {/* Tabs */}
                <div className="flex items-center border-b border-slate-200 dark:border-slate-800">
                  <div className="flex-1 flex overflow-x-auto no-scrollbar">
                    {['Detect Language', 'English', 'Ukrainian', 'German', 'French', 'Spanish'].map(l => (
                      <button 
                        key={l}
                        onClick={() => setSourceLang(l)}
                        className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${sourceLang === l ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-500'}`}
                      >
                        {l === 'Detect Language' ? t.detectLang : l}
                      </button>
                    ))}
                  </div>
                  <div className="px-4 text-slate-300 dark:text-slate-700">
                    <ArrowRightLeft size={14} className="cursor-pointer hover:text-blue-500 transition-colors" onClick={() => {
                      const temp = sourceLang;
                      setSourceLang(targetLang);
                      setTargetLang(temp === 'Detect Language' ? 'English' : temp);
                    }} />
                  </div>
                  <div className="flex-1 flex overflow-x-auto no-scrollbar">
                    {['English', 'Ukrainian', 'German', 'French', 'Spanish'].map(l => (
                      <button 
                        key={l}
                        onClick={() => setTargetLang(l)}
                        className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${targetLang === l ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-500'}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Areas */}
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="p-4 border-r border-slate-200 dark:border-slate-800 relative">
                    <textarea 
                      value={transText} 
                      onChange={(e) => setTransText(e.target.value)} 
                      className="w-full h-40 bg-transparent border-none outline-none resize-none text-lg" 
                      placeholder={t.sourceText} 
                    />
                    <div className="flex items-center gap-4 text-slate-400 mt-2">
                      <Mic size={18} className="cursor-pointer hover:text-blue-500" />
                      <Volume2 size={18} className="cursor-pointer hover:text-blue-500" />
                      <Pencil size={18} className="cursor-pointer hover:text-blue-500 ml-auto" />
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 relative">
                    {isTranslating ? (
                      <div className="flex items-center justify-center h-40">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                      </div>
                    ) : (
                      <div className="h-40 overflow-y-auto text-lg font-medium">
                        {transResult || <span className="opacity-30">{t.result}...</span>}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-slate-400 mt-2">
                      <Volume2 size={18} className="cursor-pointer hover:text-blue-500" />
                      <Copy 
                        size={18} 
                        className="cursor-pointer hover:text-blue-500" 
                        onClick={() => {
                          navigator.clipboard.writeText(transResult);
                          alert(t.copied);
                        }}
                      />
                      <Star 
                        size={18} 
                        className={`cursor-pointer ml-auto transition-colors ${savedTrans.some(s => s.result === transResult) ? 'text-yellow-500 fill-yellow-500' : 'hover:text-yellow-500'}`}
                        onClick={() => {
                          if (transResult) {
                            setSavedTrans(prev => [...prev, { source: transText, target: targetLang, result: transResult }]);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-center gap-8">
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 group-hover:scale-110 transition-all">
                    <History size={24} className="text-slate-500 group-hover:text-blue-500" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">{t.historyTitle}</span>
                </button>
                <button 
                  onClick={() => setShowSaved(!showSaved)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 group-hover:scale-110 transition-all">
                    <Star size={24} className="text-slate-500 group-hover:text-yellow-500" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">{t.savedTitle}</span>
                </button>
              </div>

              {/* History/Saved Popups */}
              <AnimatePresence>
                {(showHistory || showSaved) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="mt-6 p-4 glass rounded-2xl max-h-60 overflow-y-auto"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-xs uppercase">{showHistory ? t.historyTitle : t.savedTitle}</h3>
                      <button onClick={() => { setShowHistory(false); setShowSaved(false); }} className="text-xs opacity-50 hover:opacity-100">{t.close}</button>
                    </div>
                    <div className="space-y-3">
                      {(showHistory ? transHistory : savedTrans).map((item, i) => (
                        <div key={i} className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                          <p className="text-[10px] opacity-50 mb-1">{item.source}</p>
                          <p className="text-sm font-bold">{item.result}</p>
                        </div>
                      ))}
                      {(showHistory ? transHistory : savedTrans).length === 0 && <p className="text-center text-xs opacity-30 py-4">{t.noItems}</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            <section className="glass p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                  <Languages size={20} />
                </div>
                <h2 className="font-bold">{t.irregularVerbs}</h2>
              </div>
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-[10px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="pb-2">{t.v1}</th>
                      <th className="pb-2">{t.v2}</th>
                      <th className="pb-2">{t.v3}</th>
                      <th className="pb-2">{t.translation}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {IRREGULAR_VERBS.map((v, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50">
                        <td className="py-1 font-bold">{v.v1}</td>
                        <td className="py-1">{v.v2}</td>
                        <td className="py-1">{v.v3}</td>
                        <td className="py-1 opacity-60">{v.t[lang]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="glass p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                  <TableIcon size={20} />
                </div>
                <h2 className="font-bold">{t.trigTable}</h2>
              </div>
              <TrigTable lang={lang} />
            </section>

            <section className="glass p-6 rounded-3xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                    <BookOpen size={20} />
                  </div>
                  <h2 className="font-bold">{t.ukGrammar}</h2>
                </div>
                <button onClick={handleRefreshGrammar} disabled={isRefreshingGrammar} className="p-2 bg-amber-500 text-white rounded-lg disabled:opacity-50">
                  {isRefreshingGrammar ? <Loader2 className="animate-spin" size={16} /> : <ChevronRight size={16} />}
                </button>
              </div>
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2 no-scrollbar">
                {(dynamicGrammar.length > 0 ? dynamicGrammar : UKRAINIAN_GRAMMAR).map((g, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs font-bold text-amber-600 mb-1">{g.title}</h4>
                    <p className="text-[10px] leading-relaxed opacity-70">{g.rule}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
                  <TableIcon size={20} />
                </div>
                <h2 className="font-bold">{t.germanCasesTable}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[9px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="pb-2">{t.case}</th>
                      <th className="pb-2">{t.m}</th>
                      <th className="pb-2">{t.f}</th>
                      <th className="pb-2">{t.n}</th>
                      <th className="pb-2">{t.pl}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GERMAN_CASES.map((c, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50">
                        <td className="py-2 font-bold">{c.case}<br/><span className="text-[8px] opacity-50">{c.question}</span></td>
                        <td className="py-2">{c.m}</td>
                        <td className="py-2">{c.f}</td>
                        <td className="py-2">{c.n}</td>
                        <td className="py-2">{c.pl}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="glass p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                  <Flag size={20} />
                </div>
                <h2 className="font-bold">{t.countries}</h2>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {COUNTRIES.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <span className="text-xl">{c.flag}</span>
                    <div>
                      <p className="text-xs font-bold">{c.name[lang]}</p>
                      <p className="text-[10px] opacity-50">{c.capital[lang]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-12 text-center border-t border-slate-200 dark:border-slate-800 mt-12">
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">{t.createdBy || 'Created by AI and Maurice Nardly'}</p>
        <p className="text-[10px] text-slate-500 opacity-50">{t.credits}</p>
      </footer>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedFigure && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedFigure(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-3xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative h-64 sm:h-80">
                <img src={selectedFigure.img} alt={selectedFigure.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <button 
                  onClick={() => setSelectedFigure(null)}
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="absolute bottom-6 left-6 text-white">
                  <h2 className="text-3xl font-black tracking-tighter">{selectedFigure.name}</h2>
                  <p className="opacity-70 font-bold">{selectedFigure.years}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                {isDetailLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="animate-spin text-blue-500" size={48} />
                    <p className="text-sm font-bold animate-pulse">{t.fetchingWiki}</p>
                  </div>
                ) : (
                  <div className="prose dark:prose-invert max-w-none">
                    <div className="markdown-body">
                      <Markdown>{figureDetail}</Markdown>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button 
                  onClick={() => window.open(`https://uk.wikipedia.org/wiki/${encodeURIComponent(selectedFigure.name)}`, '_blank')}
                  className="px-6 py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Globe size={18} />
                  {t.openWiki}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
