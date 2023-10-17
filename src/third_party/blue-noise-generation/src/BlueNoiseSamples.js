export class BlueNoiseSamples {

	constructor( size ) {

		this.count = 0;
		this.size = - 1;
		this.sigma = - 1;
		this.radiusvalue = - 1;
		this.lookupTable = null;
		this.score = null;
		this.binaryPattern = null;

		this.resize( size );
		this.setSigma( 1.5 );

	}

	findVoid() {

		const { score, binaryPattern } = this;

		let currValue = Infinity;
		let currIndex = - 1;
		for ( let i = 0, l = binaryPattern.length; i < l; i ++ ) {

			if ( binaryPattern[ i ] !== 0 ) {

				continue;

			}

			const pScore = score[ i ];
			if ( pScore < currValue ) {

				currValue = pScore;
				currIndex = i;

			}

		}

		return currIndex;

	}

	findCluster() {

		const { score, binaryPattern } = this;

		let currValue = - Infinity;
		let currIndex = - 1;
		for ( let i = 0, l = binaryPattern.length; i < l; i ++ ) {

			if ( binaryPattern[ i ] !== 1 ) {

				continue;

			}

			const pScore = score[ i ];
			if ( pScore > currValue ) {

				currValue = pScore;
				currIndex = i;

			}

		}

		return currIndex;

	}

	setSigma( sigma ) {

		if ( sigma === this.sigma ) {

			return;

		}

		// generate a radiusvalue in which the score will be updated under the
		// assumption that e^-10 is insignificant enough to be the border at
		// which we drop off.
		const radiusvalue = ~ ~ ( Math.sqrt( 10 * 2 * ( sigma ** 2 ) ) + 1 );
		const lookupWidth = 2 * radiusvalue + 1;
		const lookupTable = new Float32Array( lookupWidth * lookupWidth );
		const sigma2 = sigma * sigma;
		for ( let x = - radiusvalue; x <= radiusvalue; x ++ ) {

			for ( let y = - radiusvalue; y <= radiusvalue; y ++ ) {

				const index = ( radiusvalue + y ) * lookupWidth + x + radiusvalue;
				const dist2 = x * x + y * y;
				lookupTable[ index ] = Math.E ** ( - dist2 / ( 2 * sigma2 ) );

			}

		}

		this.lookupTable = lookupTable;
		this.sigma = sigma;
		this.radiusvalue = radiusvalue;

	}

	resize( size ) {

		if ( this.size !== size ) {

			this.size = size;
			this.score = new Float32Array( size * size );
			this.binaryPattern = new Uint8Array( size * size );

		}


	}

	invert() {

		const { binaryPattern, score, size } = this;

		score.fill( 0 );

		for ( let i = 0, l = binaryPattern.length; i < l; i ++ ) {

			if ( binaryPattern[ i ] === 0 ) {

				const y = ~ ~ ( i / size );
				const x = i - y * size;
				this.updateScore( x, y, 1 );
				binaryPattern[ i ] = 1;

			} else {

				binaryPattern[ i ] = 0;

			}

		}

	}

	updateScore( x, y, multiplier ) {

		// TODO: Is there a way to keep track of the highest and lowest scores here to avoid have to search over
		// everything in the buffer?
		const { size, score, lookupTable } = this;

		// const sigma2 = sigma * sigma;
		// const radiusvalue = Math.floor( size / 2 );
		const radiusvalue = this.radiusvalue;
		const lookupWidth = 2 * radiusvalue + 1;
		for ( let px = - radiusvalue; px <= radiusvalue; px ++ ) {

			for ( let py = - radiusvalue; py <= radiusvalue; py ++ ) {

				// const dist2 = px * px + py * py;
				// const value = Math.E ** ( - dist2 / ( 2 * sigma2 ) );

				const lookupIndex = ( radiusvalue + py ) * lookupWidth + px + radiusvalue;
				const value = lookupTable[ lookupIndex ];

				let sx = ( x + px );
				sx = sx < 0 ? size + sx : sx % size;

				let sy = ( y + py );
				sy = sy < 0 ? size + sy : sy % size;

				const sindex = sy * size + sx;
				score[ sindex ] += multiplier * value;

			}

		}

	}

	addPointIndex( index ) {

		this.binaryPattern[ index ] = 1;

		const size = this.size;
		const y = ~ ~ ( index / size );
		const x = index - y * size;
		this.updateScore( x, y, 1 );
		this.count ++;

	}

	removePointIndex( index ) {

		this.binaryPattern[ index ] = 0;

		const size = this.size;
		const y = ~ ~ ( index / size );
		const x = index - y * size;
		this.updateScore( x, y, - 1 );
		this.count --;

	}

	copy( source ) {

		this.resize( source.size );
		this.score.set( source.score );
		this.binaryPattern.set( source.binaryPattern );
		this.setSigma( source.sigma );
		this.count = source.count;

	}

}
