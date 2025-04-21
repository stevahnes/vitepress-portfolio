<script setup lang="ts">
import Timeline from './components/Timeline.vue'
</script>

### Timeline

<Timeline :items="[
  { time: 'Mar 2025', title: 'Promoted to Senior Product Manager', description: 'Finally made my first career big splash.' },
  { time: 'Mar 2025', title: 'Got married', description: 'Mrs said yes to a lifetime together. Strictly no take backsies!' },
  { time: 'May 2024', title: 'Completed executive education in Product Strategy', description: 'Obtained from Northwestern Kellogg School of Management.', path: 'https://execedcertificate.kellogg.northwestern.edu/e767d718-50bc-4034-bcca-7be97a9b53ba', cta: 'Verify'  },
  { time: 'Sep 2022', title: 'Second ADPList Super Mentor award', description: 'I guess people find my thoughts and opinion rather insightful.' },
  { time: 'Jun 2022', title: 'Completed Workato\'s Automation Pro III', description: 'Became an expert in my own product, as it should be.', path: 'https://verify.skilljar.com/c/aedm5bnsixju', cta: 'Verify' },
  { time: 'Mar 2022', title: 'First ADPList Super Mentor award', description: 'Gained recognition for spending a lot of time talking.' },
  { time: 'Dec 2021', title: 'Joined ADPList as a mentor', description: 'Helped aspiring product managers/techies get their first gig in the biz.' },
  { time: 'Mar 2021', title: 'Became a Certified Usability Analyst', description: 'HFI taught me the basics of good human-computer interaction.', path: 'https://www.credly.com/badges/b924a4ba-3f7a-42d6-92e0-ac2c87f55a5e/', cta: 'Verify' },
  { time: 'Jan 2021', title: 'Became an Advanced Certified Scrum Product Owner', description: 'Basically, I got Scrum ingrained in my brain even more.', path: 'https://bcert.me/sxeivdiqf', cta: 'Verify' },
  { time: 'Apr 2020', title: 'Published 4 Figma Plugins', description: 'One of which runs a basic Snake game in Figma.' },
  { time: 'Jul 2017', title: 'Presented at IEEE AIM Conference', description: 'Flew to Germany to speak about impulse shaper and drink weißbier.', path: 'https://ieeexplore.ieee.org/document/8014259/', cta: 'View publication' },
  { time: 'Jun 2017', title: 'Conducted a robot design workshop', description: 'Got people to assemble my pseudo-Lego kit at the Art Science Museum.' },
  { time: 'Sep 2016', title: 'Received the IES Gold Medal award', description: 'Somehow graduated top of my batch again, this time in university.' },
  { time: 'Mar 2016', title: 'Became a Certified SOLIDWORKS Professional', description: 'Passed the more rigorous exam measuring my CAD proficiency.', path: 'https://cv.virtualtester.com/qr/?b=SLDWRKS&i=C-REF3DRFNDN', cta: 'Verify' },
  { time: 'Oct 2015', title: 'Exhibited at Maker Faire European Edition 2015', description: 'Flew to Italy to showcase our amphibious rolling robot.' },
  { time: 'Jun 2014', title: 'Received the Di Yerbury International Scholar award', description: 'Plus pocket money to spend during my exchange at MIT.' },
  { time: 'Jul 2013', title: 'Received the Tay Chen Hui Memorial award', description: 'Somehow graduated as top science student from my high school.' },
  { time: 'May 2013', title: 'Received the ASEAN Undergraduate Scholarship', description: 'Secured free tertiary education.' },
  { time: 'Nov 2008', title: 'Received the MOE School-Based Scholarship', description: 'And migrated to Singapore in search of a better future.' },
]" />
