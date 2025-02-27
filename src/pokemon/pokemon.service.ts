import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { isValidObjectId, Model } from 'mongoose';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class PokemonService {

  constructor(

    // Injectar modelo con mongosee
    @InjectModel( Pokemon.name )
    private readonly pokemonModel: Model<Pokemon>,

  ){}


  async create(createPokemonDto: CreatePokemonDto) {

    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();

    try {
      const pokemon = await this.pokemonModel.create( createPokemonDto );
      return pokemon;

    } catch (error) {
      this.handleExceptions( error );
    }

  }

  findAll( paginationDto: PaginationDto ) {

    const { limit = 10, offset = 0 } = paginationDto;

    return this.pokemonModel.find()
      .limit( limit )
      .skip( offset )
      .sort({no: 'asc'})
      .select('-__v')
  }

  async findOne(term: string) {

    let pokemon : Pokemon | null = null;

    // No
    if ( !isNaN(+term) ) {
      pokemon = await this.pokemonModel.findOne({ no: term });
    }

    // MongoID
    if ( isValidObjectId( term ) && !pokemon)
      pokemon = await this.pokemonModel.findById( term );

    // Name
    if ( !pokemon )
      pokemon = await this.pokemonModel.findOne({ name: term.toLocaleLowerCase().trim() })

    if ( !pokemon )
      throw new NotFoundException(`Pokemon with id, name or no "${ term }" not found`);

    return pokemon;
  }

  async update( term: string, updatePokemonDto: UpdatePokemonDto) {
    
    const pokemon = await this.findOne( term );

    if ( updatePokemonDto.name )
      updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase().trim()

    try {

      await pokemon.updateOne( updatePokemonDto );
      return { ...pokemon.toJSON(), ...updatePokemonDto }

    } catch (error) {

     this.handleExceptions( error )
    }
    
  }

  async remove( id: string ) {
    // const pokemon = await this.findOne( id )
    // await pokemon.deleteOne();
    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id });
    if ( deletedCount === 0 )
      throw new BadRequestException(`Pokemon with id "${ id }" not found`);

    return
  }

  private handleExceptions( error : any ) {
    console.log(error); // Ver el error, y mandar una exepcion
      if ( error.code === 11000 )
        throw new BadRequestException(`Pokemon exists in db ${ JSON.stringify( error.keyValue)}`);

      // Error no controlado
      throw new InternalServerErrorException(`Can't create Pokemon - Check server logs`);
  }
}
