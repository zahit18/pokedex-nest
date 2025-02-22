import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { PokeAPIResponse } from './interfaces/poke-response.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { Model } from 'mongoose';


@Injectable()
export class SeedService {


  constructor(
     @InjectModel( Pokemon.name )
      private readonly pokemonModel: Model<Pokemon>
  ){}

  private readonly axios: AxiosInstance = axios;

  
  async executeSeed(){

    await this.pokemonModel.deleteMany({}); // delete * from pokemons, no duplicar valores

    const { data } = await this.axios.get<PokeAPIResponse>('https://pokeapi.co/api/v2/pokemon?limit=650');

    const pokemonToInsert: { name: string, no: number }[] = [];

    data.results.forEach(({ name, url }) => {
      const segments = url.split('/');
      const no = +segments[ segments.length - 2]

      //console.log({ name, no })
      pokemonToInsert.push({ name, no }); // { name: 'squirtle', no: 7 }

    });

    await this.pokemonModel.insertMany( pokemonToInsert );

    return 'SEED Executed';
  }
}
