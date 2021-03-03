interface ISO {
    alpha2: string;
    alpha3: string;
}

interface Translations {
    de: string;
    es: string;
    fr: string;
    ja: string;
    it: string;
}

interface ICountry {
    name: string;
    altSpellings: string[];
    area: number;
    borders: string[];
    callingCodes: string[];
    capital: string;
    currencies: string[];
    demonym: string;
    flag: string;
    ISO: ISO;
    languages: string[];
    latlng: number[];
    nativeName: string;
    population: number;
    provinces: any[];
    region: string;
    subregion: string;
    timezones: any[];
    tld: string[];
    translations: Translations;
    wiki: string;
}

interface IISOcodes {
    alpha2: string;
    alpha3: string;
}

interface ITranslations {
   "de": string,
   "es": string,
   "fr": string,
   "ja": string,
   "it": string
}

declare module "countryjs" {
    export const info: (name: string, mode?: "ISO2" | "ISO3" | "name") => ICountry
    export const states: (name: string, mode?: "ISO2" | "ISO3" | "name") => string[]
    export const provinces: (name: string, mode?: "ISO2" | "ISO3" | "name") => string[]
    export const name: (name: string, mode?: "ISO2" | "ISO3" | "name") => string
    export const altSpellings: (name: string, mode?: "ISO2" | "ISO3" | "name") => string[]
    export const area: (name: string, mode?: "ISO2" | "ISO3" | "name") => number
    export const borders: (name: string, mode?: "ISO2" | "ISO3" | "name") => string[]
    export const callingCodes: (name: string, mode?: "ISO2" | "ISO3" | "name") => string[]
    export const capital: (name: string, mode?: "ISO2" | "ISO3" | "name") => string
    export const currencies: (name: string, mode?: "ISO2" | "ISO3" | "name") => string[]
    export const demonym: (name: string, mode?: "ISO2" | "ISO3" | "name") => string
    export const flag: (name: string, mode?: "ISO2" | "ISO3" | "name") => string
    export const ISOcodes: (name: string, mode?: "ISO2" | "ISO3" | "name") => IISOcodes
    export const languages: (name: string, mode?: "ISO2" | "ISO3" | "name") => string[]
    export const lanlatlngguages: (name: string, mode?: "ISO2" | "ISO3" | "name") => [number, number]
    export const nativeName: (name: string, mode?: "ISO2" | "ISO3" | "name") => string
    export const region: (name: string, mode?: "ISO2" | "ISO3" | "name") => string
    export const subregion: (name: string, mode?: "ISO2" | "ISO3" | "name") => string
    export const tld: (name: string, mode?: "ISO2" | "ISO3" | "name") => string[]
    export const translations: (name: string, mode?: "ISO2" | "ISO3" | "name") => ITranslations
    export const wiki: (name: string, mode?: "ISO2" | "ISO3" | "name") => string
    export const all: () => ICountry[]

}

declare module 'unzalgo' {
    /**
     * Computes a score ∈ [0, 1] for every word in the input string.
     * Each score represents the ratio  of Zalgo characters to total characters in a word.
     *
     * @param {string} string The input string for which to compute scores.
     * @return {number[]} An array of scores where each score describes the Zalgo ratio of a word.
     */
    export const computeScores: (string: string) => number[];
  
    /**
     * Determines if the string consists of Zalgo text. Note that the occurrence of a combining
     * character is not enough to trigger this method to `true`. Instead, it computes a ratio for
     * the input string and checks if it exceeds a given threshold. Thus, internationalized strings
     * aren't automatically classified as Zalgo text.
     *
     * @param {string} string A string for which a Zalgo text check is run.
     * @param {number} threshold A threshold ∈ [0, 1]. The higher the threshold, the more extreme
     * Zalgo text cases are allowed. Default is 0.55;
     * @return {boolean}- Whether the string is a Zalgo text string.
     */
    export const isZalgo: (text: string, threshold?: number) => boolean;
  
    /**
     * Removes all Zalgo text characters for every word in a string if the word is Zalgo text.
     *
     * @param {string} string A string for which Zalgo text characters are removed for every word
     * whose Zalgo property is met.
     * @param {number} [threshold=DEFAULT_THRESHOLD] A threshold between 0 and 1. The higher the
     * threshold, the more extreme Zalgo text cases are allowed. Default is 0.55
     * @return {string} A cleaned, readable string.
     */
    export const clean: (text: string, threshold?: number) => string;
  
    export default clean;
  }