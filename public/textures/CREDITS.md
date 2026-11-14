# Texture credits

## Solar System Scope (CC BY 4.0)

Planet, ring and sky textures by [Solar System Scope](https://www.solarsystemscope.com/textures/), licensed under
[Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).

| File                        | Source map                                   |
| --------------------------- | -------------------------------------------- |
| `2k_earth_daymap.ktx2`      | Earth day map (2K)                           |
| `2k_earth_clouds.ktx2`      | Earth clouds (2K)                            |
| `2k_moon.ktx2`              | Moon (2K)                                    |
| `2k_mars.ktx2`              | Mars (2K)                                    |
| `2k_jupiter.ktx2`           | Jupiter (2K)                                 |
| `2k_saturn.ktx2`            | Saturn (2K)                                  |
| `2k_saturn_ring_alpha.ktx2` | Saturn ring alpha (2K), resampled to 2048×16 |
| `2k_stars_milky_way.ktx2`   | Stars + Milky Way (2K)                       |

## U.S. Geological Survey (public domain)

Moon maps from global mosaics by the U.S. Geological Survey Astrogeology Science Center, made from
NASA Voyager, Galileo and Cassini images. "USGS-authored or produced data and information are considered
to be in the U.S. Public Domain"
([USGS copyrights and credits](https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits)).
Credit: U.S. Geological Survey Astrogeology Science Center; NASA/JPL.

Each source was downloaded from `https://planetarymaps.usgs.gov/mosaic/<file>` and downsampled to
1024×512 RGB JPEG with
`sips -s format jpeg -s formatOptions 90 -z 512 1024 -m "/System/Library/ColorSync/Profiles/sRGB Profile.icc" <file> --out 1k_<moon>.jpg`
(the profile also expands the greyscale mosaics to RGB).

| File                | Source mosaic                                            |
| ------------------- | -------------------------------------------------------- |
| `1k_io.ktx2`        | `Io_GalileoSSI-Voyager_Global_Mosaic_ClrMerge_1km.tif`   |
| `1k_europa.ktx2`    | `Europa_Voyager_GalileoSSI_global_mosaic_500m.tif`       |
| `1k_ganymede.ktx2`  | `Ganymede_Voyager_GalileoSSI_Global_ClrMosaic_1435m.tif` |
| `1k_callisto.ktx2`  | `Callisto_Voyager_GalileoSSI_global_mosaic_1km.tif`      |
| `1k_titan.ktx2`     | `Titan_ISS_P19658_Mosaic_Global_4km.tif`                 |
| `1k_rhea.ktx2`      | `Rhea_Cassini_Voyager_mosaic_global_417m.tif`            |
| `1k_iapetus.ktx2`   | `Iapetus_Cassini_Voyager_mosaic_global_783m.tif`         |
| `1k_enceladus.ktx2` | `Enceladus_Cassini_mosaic_global_110m.tif`               |

Each file is a KTX2 (Basis Universal) GPU-compressed encoding made by `pnpm textures`. Phobos,
Deimos and the asteroids are generated in code.
