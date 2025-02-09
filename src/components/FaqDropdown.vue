<script setup>
import { ref } from 'vue';

const faqs = [
    {
        question: 'Jak používat aplikaci?',
        answer: 'Přihlaste se pomocí Spotify účtu, vyberte časové období a počet položek, které chcete zobrazit. Aplikace vám ukáže vaše nejposlouchanější interprety a skladby.'
    },
    {
        question: 'Jaká data aplikace sbírá?',
        answer: 'Aplikace využívá pouze data z vašeho Spotify účtu o poslechu hudby. Žádná osobní data nejsou ukládána.'
    },
    {
        question: 'Jak často se data aktualizují?',
        answer: 'Data se aktualizují při každém načtení stránky nebo po kliknutí na tlačítko obnovit.'
    },
    {
        question: 'Jak funguje výběr časového období?',
        answer: 'Můžete vybrat ze tří období: poslední 4 týdny, posledních 6 měsíců nebo celý rok.'
    },
    {
        question: 'Ochrana osobních údajů',
        answer: [
            'Při používání této aplikace souhlasíte se zpracováním následujících údajů:',
            '• Přístup k vašim statistikám poslechu na Spotify',
            '• Základní informace o vašem Spotify profilu',
            '• Dočasné ukládání přihlašovacích tokenů',
            'Vaše data jsou používána pouze pro zobrazení statistik a nejsou nikde ukládána ani sdílena s třetími stranami.',
            'Aplikace využívá cookies pouze pro nezbytné fungování a zachování vašeho přihlášení.',
            'Při používání desktopové verze aplikace automaticky souhlasíte s využíváním cookies při každém spuštění.',
            'Pokud máte jakékoliv dotazy ohledně ochrany osobních údajů, kontaktujte mě na emailu: hello@stanekj.com'
        ]
    },
];

const openedIndex = ref(null);

const toggleFaq = (index) => {
    openedIndex.value = openedIndex.value === index ? null : index;
};
</script>

<template>
    <div class="w-9/10 md:w-2/3 mx-auto px-4">
        <div class="space-y-4">
            <div v-for="(faq, index) in faqs" :key="index" class="bg-2ndbg rounded-lg overflow-hidden">
                <button @click="toggleFaq(index)"
                    class="w-full px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors">
                    <span class="text-lg font-semibold text-white font-family">{{ faq.question }}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 transform transition-transform duration-200"
                        :class="{ 'rotate-180': openedIndex === index }" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                <div v-show="openedIndex === index" class="px-6 pb-4 text-white/80">
                    <div class="border-t border-white/10 pt-4 font-family">
                        <article v-if="Array.isArray(faq.answer)">
                            <p v-for="(line, lineIndex) in faq.answer" :key="lineIndex" class="mb-2 last:mb-0"
                                :class="{ 'ml-4': line.startsWith('•') }">
                                {{ line }}
                            </p>
                        </article>
                        <article v-else>
                            {{ faq.answer }}
                        </article>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.bg-2ndbg {
    background-color: var(--color-2ndbg);
}
</style>