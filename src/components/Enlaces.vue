<script setup lang="ts">
const links = [
  {
    category: 'Estados Unidos',
    items: [
      {
        title: 'Agendar citas USA',
        description: 'Sistema de citas para visas estadounidenses',
        url: 'https://ais.usvisa-info.com/es-do/niv',
        icon: 'mdi-calendar-clock'
      },
      {
        title: 'CEAC',
        description: 'Consulta del estado de visa',
        url: 'https://ceac.state.gov/ceac/',
        icon: 'mdi-card-search'
      },
      {
        title: 'USCIS',
        description: 'Servicios de Ciudadanía e Inmigración',
        url: 'https://www.uscis.gov/',
        icon: 'mdi-flag-variant'
      },
      {
        title: 'I-94',
        description: 'Registro de entradas y salidas',
        url: 'https://i94.cbp.dhs.gov/home',
        icon: 'mdi-file-document-outline'
      }
    ]
  },
  {
    category: 'Canadá',
    items: [
      {
        title: 'Portal Principal',
        description: 'Sitio oficial de inmigración canadiense',
        url: 'https://www.canada.ca/en.html',
        icon: 'mdi-maple-leaf'
      },
      {
        title: 'Tiempos de Procesamiento',
        description: 'Consulta de tiempos de procesamiento',
        url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/application/check-processing-times.html',
        icon: 'mdi-clock-outline'
      }
    ]
  },
  {
    category: 'Schengen',
    items: [
      {
        title: 'Seguro de Viaje',
        description: 'Seguro obligatorio para visas Schengen',
        url: 'https://bls.schengen.europ-assistance.com/en',
        icon: 'mdi-shield-check'
      },
      {
        title: 'España',
        description: 'Centro de solicitud de visas para España',
        url: 'https://do.blsspainvisa.com/',
        icon: 'mdi-flag'
      },
      {
        title: 'Francia',
        description: 'Proceso de solicitud de visas francesas',
        url: 'https://do.ambafrance.org/Proceso-de-solicitud-de-cita-para-visado#Como-tomar-una-cita-para-la-visa',
        icon: 'mdi-flag'
      },
      {
        title: 'Italia',
        description: 'Centro de solicitud de visas para Italia',
        url: 'https://do.almaviva-visa.services/',
        icon: 'mdi-flag'
      }
    ]
  },
  {
    category: 'Otros Enlaces',
    items: [
      {
        title: 'Comprobante MINERD',
        description: 'Consulta de nómina para empleados',
        url: 'https://forms.minerd.gob.do/consnomina/ConsRrhhNominas.aspx',
        icon: 'mdi-cash'
      },
      {
        title: 'Consulta Nómina SNS',
        description: 'Consulta de nómina SNS',
        url: 'https://intranet.sns.gob.do/consultasweb/ConsultaNomina',
        icon: 'mdi-cash'
      },
      {
        title: 'Citas Pasaportes',
        description: 'Sistema de citas para pasaportes',
        url: 'https://citas.pasaportes.gob.do/',
        icon: 'mdi-passport'
      }
    ]
  }
]

const openLink = (url: string) => {
  window.open(url, '_blank')
}
</script>

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-6">Enlaces Útiles</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col 
        v-for="category in links" 
        :key="category.category"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card class="mb-4">
          <v-card-title class="text-h6 font-weight-bold">
            {{ category.category }}
          </v-card-title>

          <v-card-text>
            <v-list>
              <v-list-item
                v-for="link in category.items"
                :key="link.url"
                @click="openLink(link.url)"
                class="mb-2"
              >
                <template v-slot:prepend>
                  <v-icon
                    :icon="link.icon"
                    class="mr-2"
                    color="primary"
                  ></v-icon>
                </template>

                <v-list-item-title>{{ link.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ link.description }}</v-list-item-subtitle>

                <template v-slot:append>
                  <v-icon
                    icon="mdi-open-in-new"
                    size="small"
                    color="grey"
                  ></v-icon>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.v-list-item {
  cursor: pointer;
  transition: background-color 0.2s;
  border-radius: 8px;
}

.v-list-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.v-card-title {
  background-color: rgba(var(--v-theme-primary), 0.1);
  padding: 16px;
}
</style>