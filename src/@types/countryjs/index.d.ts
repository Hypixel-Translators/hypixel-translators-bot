interface ICountry {
    name: string
    altSpellings: string[]
    area: number
    borders: string[]
    callingCodes: string[]
    capital: string
    currencies: string[]
    demonym: string
    flag: string
    ISO: {
        alpha2: string
        alpha3: string
    }
    languages: string[]
    latlng: number[]
    nativeName: string
    population: number
    provinces: any[]
    region: string
    subregion: string
    timezones: any[]
    tld: string[]
    translations: {
        de: string
        es: string
        fr: string
        ja: string
        it: string
    }
    wiki: string
}

declare module "countryjs" {

    /**
     * Returns all available information for a specified country
     * 
     * @param {string} name The name of the country
     * @param {"ISO2" | "ISO3" | "name"} mode The type of input. ISO2 by default, can be "ISO3" or "name"
     * @returns An object with all available information for the given country.
     * 
     */
    export const info: (name: string, mode: "ISO2" | "ISO3" | "name" = "ISO2") => ICountry | undefined

    /**
    * Returns all states/provinces for a specified country
    * 
    * @param {string} name The name of the country
    * @param {"ISO2" | "ISO3" | "name"} mode The type of input. ISO2 by default, can be "ISO3" or "name"
    * @returns An array of states / provinces
    * 
    */
    export const states: (name: string, mode: "ISO2" | "ISO3" | "name" = "ISO2") => string[] | undefined

    /**
    * Returns all states/provinces for a specified country
    * 
    * @param {string} name The name of the country
    * @param {"ISO2" | "ISO3" | "name"} mode The type of input. ISO2 by default, can be "ISO3" or "name"
    * @returns An array of states / provinces
    * 
    */
    export const provinces: (name: string, mode: "ISO2" | "ISO3" | "name" = "ISO2") => string[] | undefined

    /**
    * Returns name for a specified country
    * 
    * @param {string} name The name of the country
    * @param {"ISO2" | "ISO3" | "name"} mode The type of input. ISO2 by default, can be "ISO3" or "name"
    * @returns A string with the name of the country
    * 
    */
    export const name: (name: string, mode: "ISO2" | "ISO3" | "name" = "ISO2") => string | undefined

    /**
    * Returns alternate spellings for the name of a specified country
    * 
    * @param {string} name The name of the country
    * @param {"ISO2" | "ISO3" | "name"} mode The type of input. ISO2 by default, can be "ISO3" or "name"
    * @returns An array of alternate names for the country
    * 
    */
    export const altSpellings: (name: string, mode: "ISO2" | "ISO3" | "name" = "ISO2") => string[] | undefined

    /**
    * Returns area (km²) for a specified country
    * 
    * @param {string} name The name of the country
    * @param {"ISO2" | "ISO3" | "name"} mode The type of input. ISO2 by default, can be "ISO3" or "name"
    * @returns The area number in km squared
    * 
    */
    export const area: (name: string, mode: "ISO2" | "ISO3" | "name" = "ISO2") => number | undefined

    /**
    * Returns bordering countries (ISO3) for a specified country
    * 
    * @param {string} name The name of the country
    * @param {"ISO2" | "ISO3" | "name"} mode The type of input. ISO2 by default, can be "ISO3" or "name"
    * @returns An array of strings, ISO3 codes of countries that border the given country
    * 
    */
    export const borders: (name: string, mode: "ISO2" | "ISO3" | "name" = "ISO2") => string[] | undefined

    /**
    * Returns international calling codes for a specified country
    * 
    * @param {string} name The name of the country
    * @param {"ISO2" | "ISO3" | "name"} mode The type of input. ISO2 by default, can be "ISO3" or "name"
    * @returns An array of calling code strings
    * 
    */
    export const callingCodes: (name: string, mode: "ISO2" | "ISO3" | "name" = "ISO2") => string[] | undefined

    /**
    * Returns capital city for a specified country
    * 
    * @param {string} name The name of the country
    * @param {"ISO2" | "ISO3" | "name"} mode The type of input. ISO2 by default, can be "ISO3" or "name"
    * @returns A string with the name of the capital city
    * 
    */
    export const capital: (name: string, mode: "ISO2" | "ISO3" | "name" = "ISO2") => string | undefined

    /**
    * Returns official currencies for a specified country
    * 
    * @param {string} name The name of the country
    * @param {"ISO2" | "ISO3" | "name"} mode The type of input. ISO2 by default, can be "ISO3" or "name"
    * @returns An array of currency strings
    * 
    */
    export const currencies: (name: string, mode: "ISO2" | "ISO3" | "name" = "ISO2") => string[] | undefined

    /**
    * Returns the demonyms for a specified country
    * 
    * @param {string} name The name of the country
    * @param {"ISO2" | "ISO3" | "name"} mode The type of input. ISO2 by default, can be "ISO3" or "name"
    * @returns A string with the name of the residents
    * 
    */
    export const demonym: (name: string, mode: "ISO2" | "ISO3" | "name" = "ISO2") => string | undefined

    /**
    * Returns SVG link of the official flag for a specified country - INCOMPLETE
    * 
    * @param {string} name The name of the country
    * @param {"ISO2" | "ISO3" | "name"} mode The type of input. ISO2 by default, can be "ISO3" or "name"
    * @returns A string URL of CC licensed svg flag
    * 
    */
    export const flag: (name: string, mode: "ISO2" | "ISO3" | "name" = "ISO2") => string | undefined

    //export const geoJSON: (name: string, mode: "ISO2" | "ISO3" | "name" = "ISO2") => geoJSON

    /**
    * Returns ISO codes for a specified country
    * 
    * @param {string} name The name of the country
    * @param {"ISO2" | "ISO3" | "name"} mode The type of input. ISO2 by default, can be "ISO3" or "name"
    * @returns An object of ISO codes
    * 
    */
    export const ISOcodes: (name: string, mode: "ISO2" | "ISO3" | "name" = "ISO2") => { alpha2: string, alpha3: string } | undefined

    /**
    * Returns official languages for a specified country
    * 
    * @param {string} name The name of the country
    * @param {"ISO2" | "ISO3" | "name"} mode The type of input. ISO2 by default, can be "ISO3" or "name"
    * @returns An array of language codes
    * 
    */
    export const languages: (name: string, mode: "ISO2" | "ISO3" | "name" = "ISO2") => string[] | undefined

    /**
    * Returns approx latitude and longitude for a specified country
    * 
    * @param {string} name The name of the country
    * @param {"ISO2" | "ISO3" | "name"} mode The type of input. ISO2 by default, can be "ISO3" or "name"
    * @returns An array of approx latitude and longitude numbers for the country
    * 
    */
    export const latlng: (name: string, mode: "ISO2" | "ISO3" | "name" = "ISO2") => [number, number] | undefined

    /**
    * Returns the name of the country in its native tongue
    * 
    * @param {string} name The name of the country
    * @param {"ISO2" | "ISO3" | "name"} mode The type of input. ISO2 by default, can be "ISO3" or "name"
    * @returns A string, name of country in its native language
    * 
    */
    export const nativeName: (name: string, mode: "ISO2" | "ISO3" | "name" = "ISO2") => string | undefined

    /**
    * Returns approximate population for a specified country
    * 
    * @param {string} name The name of the country
    * @param {"ISO2" | "ISO3" | "name"} mode The type of input. ISO2 by default, can be "ISO3" or "name"
    * @returns A number, approx population
    * 
    */
    export const population: (name: string, mode: "ISO2" | "ISO3" | "name" = "ISO2") => number | undefined

    /**
    * Returns general region for a specified country
    * 
    * @param {string} name The name of the country
    * @param {"ISO2" | "ISO3" | "name"} mode The type of input. ISO2 by default, can be "ISO3" or "name"
    * @returns A string with the general region for the country
    * 
    */
    export const region: (name: string, mode: "ISO2" | "ISO3" | "name" = "ISO2") => string | undefined

    /**
    * Returns a more specific region for a specified country
    * 
    * @param {string} name The name of the country
    * @param {"ISO2" | "ISO3" | "name"} mode The type of input. ISO2 by default, can be "ISO3" or "name"
    * @returns A string with the specific region of the country
    * 
    */
    export const subregion: (name: string, mode: "ISO2" | "ISO3" | "name" = "ISO2") => string | undefined

    /**
    * Returns all timezones for a specified country
    * 
    * @param {string} name The name of the country
    * @param {"ISO2" | "ISO3" | "name"} mode The type of input. ISO2 by default, can be "ISO3" or "name"
    * @returns An array of timezones
    * 
    */
    export const timezones: (name: string, mode: "ISO2" | "ISO3" | "name" = "ISO2") => string[] | undefined

    /**
    * Returns official top level domains for a specified country
    * 
    * @param {string} name The name of the country
    * @param {"ISO2" | "ISO3" | "name"} mode The type of input. ISO2 by default, can be "ISO3" or "name"
    * @returns An array of top level domains specific to the country
    * 
    */
    export const tld: (name: string, mode: "ISO2" | "ISO3" | "name" = "ISO2") => string[] | undefined

    /**
    * Returns translations for a specified country name in popular languages
    * 
    * @param {string} name The name of the country
    * @param {"ISO2" | "ISO3" | "name"} mode The type of input. ISO2 by default, can be "ISO3" or "name"
    * @returns An object of translations of the country name in major languages
    * 
    */
    export const translations: (name: string, mode: "ISO2" | "ISO3" | "name" = "ISO2") => { de: string, es: string, fr: string, ja: string, it: string } | undefined

    /**
    * Returns link to wikipedia page for a specified country
    * 
    * @param {string} name The name of the country
    * @param {"ISO2" | "ISO3" | "name"} mode The type of input. ISO2 by default, can be "ISO3" or "name"
    * @returns A string URL of the Wikipedia article on the country
    * 
    */
    export const wiki: (name: string, mode: "ISO2" | "ISO3" | "name" = "ISO2") => string | undefined

    /**
    * Returns array of objects containing all available data for all countries. This will be super big. Not recommended.
    * 
    * @returns An array of objects with all the information for every country
    * 
    */
    export const all: () => ICountry[]

}
