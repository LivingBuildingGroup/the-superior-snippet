'use strict';

const { convertSpaceToDash } = require('conjunction-junction');

const parseTextFromHtml = body => {
  const bodyArr1 = typeof body === 'string' ?
    body.split('<') : [];

  const bodyArr2 = bodyArr1.map(b=>{
    const subArr = b.split('>');
    return subArr[1];
  });
	
  const bodyArrString1 = bodyArr2.filter(b=>{
    if(b && b !== '\r\n'){
      return true;
    }
  }).join(' \n');

  const bodyArrString2 = bodyArrString1.split('&nbsp;').join(' ');

  const bodyWithoutSpecial = bodyArrString2.split('****').join(' ');

  return bodyWithoutSpecial;
};

// @@@@@@@@@@@@@@@@@@@@@ NEWS ARTICLE @@@@@@@@@@@@@@@@

const articleExample1 = {
  '@context': 'https://schema.org',
  '@type': 'NewsArticle',
  headline: 'Article headline',
  image: [
    'https://example.com/photos/1x1/photo.jpg',
    'https://example.com/photos/4x3/photo.jpg',
    'https://example.com/photos/16x9/photo.jpg'
		 ],
		 // dates must be in this format https://en.wikipedia.org/wiki/ISO_8601
  datePublished: '2015-02-05T08:00:00+08:00',
  dateModified: '2015-02-05T09:20:00+08:00'
};

const structureNewsArticle = data => {

  const bodyArr = typeof data.body === 'string' ?
    data.body.split('src="') : [];
		
  const images = bodyArr.map(s=>{
    const subArr = s.split('"');
    return subArr[0];
  });

  // the first item in the array will be the text before the first image
  // after the first item, it should only be images
  // just replace the first image with the featured image
  images[0]=data.featured_image;

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: data.seo_title,
    image: images,
    datePublished: data.published,
    dateModified:  data.updated || data.published,
  };
};

// @@@@@@@@@@@@@@@@@@ BLOG POST @@@@@@@@@@@@@@@@@@@@@@@@@

const blogPostExample1 = {
  '@context': 'http://schema.org',
  '@type': 'BlogPosting',
  // this means that this blog post is the main entity of a page
  // list the page (where the blog post is found)
  mainEntityOfPage: {
    '@type':'WebPage',
    '@id':'http://applefostering.co.uk/skills-foster/'
  },
  headline: 'The Skills to Foster',
  // The blog post’s image has to be a minimum of 700 pixels wide
  image: {
    '@type': 'ImageObject',
    url: 'http://applefostering.co.uk/wp-content/uploads/family.jpg',
    height: 463,
    width: 700
  },
  datePublished: '2015-02-05T08:00:00+08:00',
  dateModified: '2015-02-05T09:20:00+08:00',
  author: {
    '@type': 'Person',
    name: 'Person’s Name'
  },
  publisher: {
    '@type': 'Organization',
    name: 'Apple Fostering',
    // Within the Publisher section, the logo of your business has to be 550 pixels wide x 60 pixels high (this is not the case in regular Organization schema – only when you add it within article schema)
    logo: {
      '@type': 'ImageObject',
      url: 'http://applefostering.co.uk/apple-logo-schema/',
      width: 550,
      height: 60
    }
  },
  description: 'A brief description of your article',
  articleBody: 'You can put your entire article in here: it can be as long as you want.'
};

const structureBlogPost = (data, _config) => {
  // input: post using current Butter API

  if(!data){
    return {};
  }
	
	
  const articleBody = parseTextFromHtml(data.body);

  const config = Object.assign({},
    {
      baseUrl:        'https://www.example.com',
      articlePath:    'post',
      organization:   'My Organization',
      logoUrl:        'https://www.my-organization-550x60px-logo.png',
      termPathPrefix: '?term='
    },
    _config);

  const author = data.author || {};

  return {
    '@context': 'http://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage:{
      '@type':'WebPage',
      '@id': `${config.baseUrl}/${config.articlePath}/${data.slug}`
    },
    headline: data.seo_title,
    // The blog post’s image has to be a minimum of 700 pixels wide
    image: {
      '@type': 'ImageObject',
      url: data.featured_image,
      height: 630,
      width: 1200,
    },
    datePublished: data.published,
    dateModified:  data.updated || data.published,
    author: {
      '@type': 'Person',
      name: `${author.first_name} ${author.last_name}`,
    },
    'publisher': {
      '@type': 'Organization',
      name: config.organization,
      // Within the Publisher section, the logo of your business has to be 550 pixels wide x 60 pixels high (this is not the case in regular Organization schema – only when you add it within article schema)
      logo: {
        '@type': 'ImageObject',
        url: config.logoUrl,
        width: 550,
        height: 60
      }
    },
    description: data.meta_description,
    articleBody,
  };
};

// @@@@@@@@@@@@@@@@@@@ TERMINOLOGY @@@@@@@@@@@@@@@

const terminologyExample1 = [
  {
    '@context': 'http://schema.org/'
  },
  {
    '@type': ['DefinedTermSet','Book'],
    '@id': 'http://openjurist.org/dictionary/Ballentine',
    name: 'Ballentine\'s Law Dictionary'
  },
  {
    '@type': 'DefinedTerm',
    '@id': 'http://openjurist.org/dictionary/Ballentine/term/calendar-year',
    name: 'calendar year',
    description: 'The period from January 1st to December 31st, inclusive, of any year.',
    inDefinedTermSet: 'http://openjurist.org/dictionary/Ballentine'
  },
  {
    '@type': 'DefinedTerm',
    '@id': 'http://openjurist.org/dictionary/Ballentine/term/schema',
    name: 'schema',
    description: 'A representation of a plan or theory in the form of an outline or model.',
    inDefinedTermSet: 'http://openjurist.org/dictionary/Ballentine',
    sameAs: 'https://en.wikipedia.org/wiki/Coal',
  }
];

const structureTerm = (term, termSet, config) => {

  const path = typeof term.termPath === 'string' &&
		term.termPath.length > 0 ? term.termPath :
    convertSpaceToDash(term.termName);

  const formatted = {
    '@type':          'DefinedTerm',
    '@id':            `${config.baseUrl}${config.termPathPrefix}${path}`,
    name:             term.termName,
    description:      term.termDef,
    inDefinedTermSet: termSet
  };
  if(term.sameAs){
    formatted.sameAs = term.sameAs;
  }
  return formatted;
};

const structureTermSet = (termObj, _config) => {
  /* input:
	 {
		 url: '',
		 name: 'Green Roof Terminology',
		 list: [
			 {
				 termName: 'Green Roof',
				 termDef: '',
         termPath: 'green-roof', OPTIONAL
			 }
		 ]
	 }
	 */

  const config = Object.assign({},
    {
      baseUrl:        'https://www.example.com',
      articlePath:    'post',
      organization:   'My Organization',
      logoUrl:        'https://www.my-organization-550x60px-logo.png',
      termPathPrefix: '?term=',
    },
    _config);

  const termSetHeader = [
    {
      '@context': 'http://schema.org/'
    },
    {
      '@type': ['DefinedTermSet'],
      '@id': termObj.url,
      name: termObj.name,
    },
  ];

  const termList = Array.isArray(termObj.list) ?
	  termObj.list.map(t=>{
      return structureTerm(t, termObj.url, config);
    }) : [];

  return [...termSetHeader, ...termList];
};

// @@@@@@@@@@@@@@@@@@ FAQ @@@@@@@@@@@@@@@@@@@@@@@@@

const faqExample1 = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is the return policy?',
      acceptedAnswer: {
        '@type': 'Answer',
        //The full answer to the question. The answer may contain HTML content such as links and lists. Valid HTML tags include: <h1> through <h6>, <br>, <ol>, <ul>, <li>, <a>, <p>, <div>, <b>, <strong>, <i>, and <em>.
        text: 'Most unopened items in new condition and returned within <strong>90 days</strong> will receive a refund or exchange. Some items have a modified return policy noted on the receipt or packing slip. Items that are opened or damaged or do not have a receipt may be denied a refund or exchange. Items purchased online or in-store may be returned to any store.<br /><p>Online purchases may be returned via a major parcel carrier. <a href=http://example.com/returns> Click here </a> to initiate a return.</p>'
      }
    }, 
    {
      '@type': 'Question',
      name: 'How long does it take to process a refund?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We will reimburse you for returned items in the same way you paid for them. For example, any amounts deducted from a gift card will be credited back to a gift card. For returns by mail, once we receive your return, we will process it within 4–5 business days. It may take up to 7 days after we process the return to reflect in your account, depending on your financial institution\'s processing time.'
      }
    }, 
    {
      '@type': 'Question',
      name: 'What is the policy for late/non-delivery of items ordered online?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our local teams work diligently to make sure that your order arrives on time, within our normaldelivery hours of 9AM to 8PM in the recipient\'s time zone. During  busy holiday periods like Christmas, Valentine\'s and Mother\'s Day, we may extend our delivery hours before 9AM and after 8PM to ensure that all gifts are delivered on time. If for any reason your gift does not arrive on time, our dedicated Customer Service agents will do everything they can to help successfully resolve your issue. <br/> <p><a href=https://example.com/orders/>Click here</a> to complete the form with your order-related question(s).</p>'
      }
    }, 
    {
      '@type': 'Question',
      name: 'When will my credit card be charged?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We\'ll attempt to securely charge your credit card at the point of purchase online. If there\'s a problem, you\'ll be notified on the spot and prompted to use another card. Once we receive verification of sufficient funds, your payment will be completed and transferred securely to us. Your account will be charged in 24 to 48 hours.'
      }
    }, 
    {
      '@type': 'Question',
      name: 'Will I be charged sales tax for online orders?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:'Local and State sales tax will be collected if your recipient\'s mailing address is in: <ul><li>Arizona</li><li>California</li><li>Colorado</li></ul>'
      }
    }
  ]
};

const structureFaqItem = data => {
  /* input: {
    question: '', // just text, no formatting
    answer: { 
      answerBasic: '',     // can include <br>, <ol>, <ul>, <li>, <strong>
                     // live site parses; structured data uses verbatim
			answerA1: '',        // E.g. To learn more read // no formatting in any below
			answerHref: '',      // https://www.example.com
			answerHrefText: '',  // this article
			answerA2: ''         // about green roof detention.
		} // additional text NOT to include in structure data
  } */

  if(!data || typeof data.question !== 'string'){
    return null;
  }

  const answer = data.answer;

  if(!answer || typeof answer.answerBasic !== 'string'){
    return null;
  }
  
  const answerFormatted = 'string' && 
	  answer.answerA1 && answer.answerHref && answer.answerHrefText ?
    `${answer.answerBasic} <p>${answer.answerA1} <a href=${answer.answerHref}>${answer.answerHrefText}</a> ${answer.answerA2 || ''}</p>` :
    answer.answerBasic ;
		
  return {
    '@type': 'Question',
    name: data.question,
    acceptedAnswer: {
      '@type': 'Answer',
      //The full answer to the question. The answer may contain HTML content such as links and lists. Valid HTML tags include: <h1> through <h6>, <br>, <ol>, <ul>, <li>, <a>, <p>, <div>, <b>, <strong>, <i>, and <em>.
      text: answerFormatted
    }, 
  };
};

const structureFaqItems = arr => {
  /* input: [
		{
      question: '', // just text, no formatting
      answer: { 
        answerBasic: '',     // can include <br>, <ol>, <ul>, <li>, <strong>
                      // live site parses; structured data uses verbatim
        answerA1: '',        // E.g. To learn more read // no formatting in any below
        answerHref: '',      // https://www.example.com
        answerHrefText: '',  // this article
        answerA2: ''         // about green roof detention.
      } // additional text NOT to include in structure data
    }
	] */
  if(Array.isArray(arr)){
    return {
      '@context': 'https://schema.org',
		  '@type': 'FAQPage',
      mainEntity: arr.map(q=>structureFaqItem(q)).filter(a=>a!==null),
    };
  }
};

// @@@@@@@@@@@@@@@@@@@@@ VIDEO @@@@@@@@@@@@@@@@

const videoExample1 = {
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: 'Introducing the self-driving bicycle in the Netherlands',
  description: 'This spring, Google is introducing the self-driving bicycle in Amsterdam, the world’s premier cycling city. The Dutch cycle more than any other nation in the world, almost 900 kilometres per year per person, amounting to over 15 billion kilometres annually. The self-driving bicycle enables safe navigation through the city for Amsterdam residents, and furthers Google’s ambition to improve urban mobility with technology. Google Netherlands takes enormous pride in the fact that a Dutch team worked on this innovation that will have great impact in their home country.',
  thumbnailUrl: 'https://www.example.com/thumbnail.jpg',

  // thumbnailUrl: [
  //   'https://example.com/photos/1x1/photo.jpg',
  //   'https://example.com/photos/4x3/photo.jpg',
  //   'https://example.com/photos/16x9/photo.jpg'
  //  ],
  uploadDate: '2016-03-31T08:00:00+08:00',
  duration: 'PT1M54S', // https://en.wikipedia.org/wiki/ISO_8601
  contentUrl: 'https://www.example.com/video/123/file.mp4',
  embedUrl: 'https://www.example.com/embed/123',
  publisher: {
    '@type': 'Organization',
    name: 'Name of your organization',
    logo: {
      '@type': 'ImageObject',
      url: 'https://example.com/logo.jpg',
      width: 600,
      height: 60
    }
  },
  interactionStatistic: {
    '@type': 'InteractionCounter',
    interactionType: { '@type': 'http://schema.org/WatchAction' },
    userInteractionCount: 5647018
  }
};

const structureVideo = (data, isTopLevel=true, _config) => {
	
  const config = Object.assign({},
    {
      baseUrl:        'https://www.example.com',
      articlePath:    'post',
      organization:   'My Organization',
      logoUrl:        'https://www.my-organization-550x60px-logo.png',
      termPathPrefix: '?term='
    },
    _config);
		
  const video = {
    '@type':     'VideoObject',
    name:         data.name,
    description:  data.description,
    thumbnailUrl: data.thumbnailUrl,
    uploadDate:   data.uploadDate,
    duration:     data.duration, // https://en.wikipedia.org/wiki/ISO_8601
    embedUrl:     data.embedUrl,
    publisher: {
      '@type': 'Organization',
      name: config.organization,
      logo: {
        '@type': 'ImageObject',
        url: config.logoUrl,
        width: 600,
        height: 60
      }
    },
  };

  if(isTopLevel){
    video['@context'] = 'https://schema.org';
  }

  return video;
};

// @@@@@@@@@@@@@@@@@@@@@ HOW TO @@@@@@@@@@@@@@@@

const howToExample1 = {
  // Here's an example of a text based how-to page using JSON-LD. The example only has one image that represents the final state of the how-to. In this result, users may see a preview of the content for some steps.
  '@context': 'http://schema.org',
  '@type': 'HowTo',
  name: 'How to tile a kitchen backsplash',
  description: 'Any kitchen can be much more vibrant with a great tile backsplash. This guide will help you install one with beautiful results, like our example kitchen seen here.',
  image: {
    '@type': 'ImageObject',
    url: 'https://example.com/photos/1x1/photo.jpg',
    height: '406',
    width: '305'
  },
  estimatedCost: {
    '@type': 'MonetaryAmount',
    currency: 'USD',
    value: 100
  },
  supply: [
    {
      '@type': 'HowToSupply',
      name: 'tiles'
    }, {
      '@type': 'HowToSupply',
      name: 'thin-set mortar'
    }, {
      '@type': 'HowToSupply',
      name: 'tile grout'
    }, {
      '@type': 'HowToSupply',
      name: 'grout sealer'
    }
  ],
  tool: [
    {
      '@type': 'HowToTool',
      name: 'notched trowel'
    }, {
      '@type': 'HowToTool',
      name: 'bucket'
    },{
      '@type': 'HowToTool',
      name: 'large sponge'
    }
  ],
  step: [
    {
      '@type': 'HowToStep',
      url: 'https://example.com/kitchen#step1',
      name: 'Prepare the surfaces',
      itemListElement: [
        {
          '@type': 'HowToDirection',
          text: 'Turn off the power to the kitchen and then remove everything that is on the wall, such as outlet covers, switchplates, and any other item in the area that is to be tiled.'
        }, 
        {
          '@type': 'HowToDirection',
          text: 'Then clean the surface thoroughly to remove any grease or other debris and tape off the area.'
        }
      ],
      image: {
        '@type': 'ImageObject',
        url: 'https://example.com/photos/1x1/photo-step1.jpg',
        height: '406',
        width: '305'
      }
    }, 
    {
      '@type': 'HowToStep',
      name: 'Plan your layout',
      url: 'https://example.com/kitchen#step2',
      itemListElement: [
        {
          '@type': 'HowToTip',
          text: 'The creases created up until this point will be guiding lines for creating the four walls of your planter box.'
        }, 
        {
          '@type': 'HowToDirection',
          text: 'Lift one side at a 90-degree angle, and fold it in place so that the point on the paper matches the other two points already in the center.'
        }, 
        {
          '@type': 'HowToDirection',
          text: 'Repeat on the other side.'
        }
      ],
      image: {
        '@type': 'ImageObject',
        url: 'https://example.com/photos/1x1/photo-step2.jpg',
        height: '406',
        width: '305'
      }
    }, 
    {
      '@type': 'HowToStep',
      name: 'Prepare your and apply mortar (or choose adhesive tile)',
      url: 'https://example.com/kitchen#step3',
      itemListElement: [
        {
          '@type': 'HowToDirection',
          text: 'Follow the instructions on your thin-set mortar to determine the right amount of water to fill in your bucket. Once done, add the powder gradually and make sure it is thoroughly mixed.'
        }, 
        {
          '@type': 'HowToDirection',
          text: 'Once mixed, let it stand for a few minutes before mixing it again. This time do not add more water. Double check your thin-set mortar instructions to make sure the consistency is right.'
        },
			 {
          '@type': 'HowToDirection',
          text: 'Spread the mortar on a small section of the wall with a trowel.'
        },
			 {
          '@type': 'HowToTip',
          text: 'Thinset and other adhesives set quickly so make sure to work in a small area.'
        },
			 {
          '@type': 'HowToDirection',
          text: 'Once it’s applied, comb over it with a notched trowel.'
        }
      ],
      image: {
        '@type': 'ImageObject',
        url: 'https://example.com/photos/1x1/photo-step3.jpg',
        height: '406',
        width: '305'
      }
    }, 
    {
      '@type': 'HowToStep',
      name: 'Add your tile to the wall',
      url: 'https://example.com/kitchen#step4',
      itemListElement: [
        {
          '@type': 'HowToDirection',
          text: 'Place the tile sheets along the wall, making sure to add spacers so the tiles remain lined up.'
        }, 
        {
          '@type': 'HowToDirection',
          text: 'Press the first piece of tile into the wall with a little twist, leaving a small (usually one-eight inch) gap at the countertop to account for expansion. use a rubber float to press the tile and ensure it sets in the adhesive.'
        }, 
        {
          '@type': 'HowToDirection',
          text: 'Repeat the mortar and tiling until your wall is completely tiled, Working in small sections.'
        }
      ],
      image: {
        '@type': 'ImageObject',
        url: 'https://example.com/photos/1x1/photo-step4.jpg',
        height: '406',
        width: '305'
      }
    }, 
    {
      '@type': 'HowToStep',
      name: 'Apply the grout',
      url: 'https://example.com/kitchen#step5',
      itemListElement: [
        {
          '@type': 'HowToDirection',
          text: 'Allow the thin-set mortar to set. This usually takes about 12 hours. Don’t mix the grout before the mortar is set, because you don’t want the grout to dry out!'
        }, 
        {
          '@type': 'HowToDirection',
          text: 'To apply, cover the area thoroughly with grout and make sure you fill all the joints by spreading it across the tiles vertically, horizontally, and diagonally. Then fill any remaining voids with grout.'
        }, 
        {
          '@type': 'HowToDirection',
          text: 'Then, with a moist sponge, sponge away the excess grout and then wipe clean with a towel. For easier maintenance in the future, think about applying a grout sealer.'
        }
      ],
      image: {
        '@type': 'ImageObject',
        url: 'https://example.com/photos/1x1/photo-step5.jpg',
        height: '406',
        width: '305'
      }
    }
  ],
  totalTime: 'P2D'
};

const howToExample2 = {
  // Here's an example of a how-to page with images for each step using JSON-LD. When there's an image for each step, users may see a preview with a carousel of images.
  '@context': 'http://schema.org',
  '@type': 'HowTo',
  image: {
    '@type': 'ImageObject',
    url: 'https://example.com/1x1/photo.jpg'
  },
  name: 'How to tie a tie',
  description: 'The four-in-hand knot is a great look for any occasion. From formal suits to casual jacket and tie affairs, it’s a simple way to quickly look great. Once you have mastered the knot you can tie it in just a minute, so it’s also great when you’re in a pinch too. ',
  totalTime: 'PT2M',
  video: {
    '@type': 'VideoObject',
    name: 'Tie a Tie',
    description: 'How to tie a four-in-hand knot.',
    thumbnailUrl: 'https://example.com/photos/photo.jpg',
    contentUrl: 'http://www.example.com/videos/123_600x400.mp4',
    embedUrl: 'http://www.example.com/videoplayer?id=123',
    uploadDate: '2019-01-05T08:00:00+08:00',
    duration: 'P1MT10S' // https://en.wikipedia.org/wiki/ISO_8601
  },
  supply: [
    {
      '@type': 'HowToSupply',
      name: 'A tie'
    }, {
      '@type': 'HowToSupply',
      name: 'A collared shirt'
    }
  ],
  'tool': [
    {
      '@type': 'HowToTool',
      name: 'A mirror'
    }
  ],
  step:[
    {
      '@type': 'HowToStep',
      name: 'Preparations',
      text: 'Button your shirt how you’d like to wear it, then drape the tie around your neck. Make the thick end about 1/3rd longer than the short end. For formal button down shirts, it usually works best with the small end of the tie between 4th and 5th button.',
      image: 'https://example.com/1x1/step1.jpg',
      url: 'https://example.com/tie#step1'
    }, 
    {
      '@type': 'HowToStep',
      name: 'Crossing once',
      text: 'Cross the long end over the short end. This will form the basis for your knot.',
      image: 'https://example.com/1x1/step2.jpg',
      url: 'https://example.com/tie#step2'
    }, 
    {
      '@type': 'HowToStep',
      name: 'Second crossing',
      text: 'Bring the long end back under the short end, then throw it back over the top of the short end in the other direction.',
      image: 'https://example.com/1x1/step3.jpg',
      url: 'https://example.com/tie#step3'
    }, 
    {
      '@type': 'HowToStep',
      name: 'Loop in',
      text: 'Now pull the long end through the loop near your neck, forming another loop near your neck.',
      image: 'https://example.com/1x1/step4.jpg',
      url: 'https://example.com/tie#step4'
    }, 
    {
      '@type': 'HowToStep',
      name: 'Pull and tighten',
      text: 'Pull the long end through that new loop and tighten to fit!',
      image: 'https://example.com/1x1/step5.jpg',
      url: 'https://example.com/tie#step5'
    }
  ]
};

const structureHowTo = data => {

  /* input: {
		name: '',
		description: '',
		totalTime: '', DURATION: https://en.wikipedia.org/wiki/ISO_8601
		src: '',
		height: 0,
		width: 0,
		video: {
			name: ''
			description: ''
			thumbnailUrl: ''
			uploadDate: ''
			duration: '' DURATION: https://en.wikipedia.org/wiki/ISO_8601
			embedUrl: ''
		},
		supplies: [''],
		tools: [''],
	  steps: [
      // OPTION 1
			{
				name: 'Pull and tighten',
				text: 'Pull the long end through that new loop and tighten to fit!',
				url: 'https://example.com/tie#step5'
				// single image
				src: 'https://example.com/1x1/step5.jpg',
      },
      // OPTION 2
			{
				name: 'Pull and tighten',
				list: [ '' ]
				url: 'https://example.com/tie#step5'
				src: 'https://example.com/photos/1x1/photo-step5.jpg',
				height: 406,
				width: 305
			}
		]
	 */

  const howTo = {
    '@context': 'http://schema.org',
    '@type': 'HowTo',
    name: data.name,
    description: data.description,
  };

  if(data.totalTime){
    howTo.totalTime = data.totalTime; // DURATION: https://en.wikipedia.org/wiki/ISO_8601
  }

  if(data.src && data.height && data.width){
    howTo.image = {
      '@type': 'ImageObject',
      url: data.src,
      height: data.height,
      width: data.width,
    };
  } else if(data.src){
    howTo.image = data.src;
  }

  if(data.video){
    howTo.video = structureVideo(data.video);
  }

  if(Array.isArray(data.supplies)){
    howTo.supply = data.supplies.map(s=>{
      return {
        '@type': 'HowToSupply',
        name: s
      };
    });
  }

  if(Array.isArray(data.tools)){
    howTo.tool = data.tools.map(t=>{
      return {
        '@type': 'HowToTool',
        name: t
      };
    });
  }

  if(Array.isArray(data.steps)){
    howTo.step = data.steps.map(s=>{
      const step = {
        '@type': 'HowToStep',
        url: s.url,
        name: s.name,
      };

      if(Array.isArray(s.list)){
        step.itemListElement = s.list.map(x=>{
          return {
            '@type': 'HowToDirection',
            text: x,
          }; 
        });
      }

      if(s.text){
        if(typeof s.text === 'string'){
          step.text = s.text;
        } else if(Array.isArray(s.text)){
          const textArr = s.text.map(t=>{
            if(typeof t === 'string'){
              return t;
            }
            if(typeof t.text === 'string'){
              return t.text;
            }
            return '';
          });
          step.text = textArr.join('');
        }
      }
      if(s.src){
        step.image = s.src;
      }
      if(s.url){
        step.url = s.url;
      }

      return step;
    });
  }

  return howTo;

};

const convertHowToArrToElementsAndSteps = arr => {
  const elements = [];
  const steps = [];
  let olIndex;
  let stepIndex = 1;
  arr.forEach((s,i)=>{
    if(s.element === 'how-to-step'){
      const element = Object.assign({}, s, {element: 'p-link'});
      if(typeof s.name === 'string'){
        const h3 = {
          element: 'h3',
          text: `Step ${stepIndex}: ${s.name}`,
        };
        elements.push(h3);
        stepIndex++;
      }
      elements.push(element);
      steps.push(s);
      if(s.src && s.alt){
        elements.push({
          element: 'image',
          src: s.src,
          alt: s.alt,
          caption: s.caption,
        });
      }
    } else if(s==='STEPS'){
      olIndex = i;
      elements.push('');
    } else {
      elements.push(s);
    }
  });
  if(olIndex){ // should not be 0
    elements[olIndex] = {
      element: 'ol',
      list: steps.map(s=>s.name),
    };
  }
  return {
    elements, 
    steps,
  };
};

// @@@@@@@@@@@@@@@@@@@ NESTED @@@@@@@@@@@@@@@

const nestedExample1 = {
  // Here's an example of nested structured data, where Recipe is the main item, and aggregateRating and video are nested in the Recipe.
  '@context': 'https://schema.org/',
  '@type': 'Recipe',
  name: 'Banana Bread Recipe',
  description: 'The best banana bread recipe you\'ll ever find! Learn how to use up all those extra bananas.',
  aggregateRating: {
    '@type': 'aggregateRating',
    ratingValue: '4.7',
    ratingCount: '123'
  },
  video: {
    '@type': 'VideoObject',
    name: 'How To Make Banana Bread',
    description: 'This is how you make banana bread, in 5 easy steps.',
    contentUrl: 'http://www.example.com/video123.mp4'
  }
};

const structureNested = () => {
  return {

  };
};

module.exports = {
  parseTextFromHtml,
  structureNewsArticle,
  structureBlogPost,
  structureFaqItem,
  structureFaqItems,
  structureVideo,
  structureHowTo,
  convertHowToArrToElementsAndSteps,
  structureTerm,
  structureTermSet,
  structureNested,
};